/*
 * Syncs verified Solana tokenised stocks into data/tokens/representations.json.
 *
 * Jupiter's token search is only a candidate catalogue. A row is written only
 * after Solana itself agrees about the mint program, decimals, authorities,
 * name and symbol. Provider identity comes from the live mint authority, not
 * from a label in the catalogue.
 *
 * Usage, from the repository root:
 *   node scripts/sync-solana-tokens.mjs --symbols META,AVGO --dry-run
 *   node scripts/sync-solana-tokens.mjs --list
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { PublicKey } from "@solana/web3.js";

const OUT = new URL("../data/tokens/representations.json", import.meta.url);
const PROVIDERS_FILE = new URL("../data/tokens/providers.json", import.meta.url);
const ENV_FILE = new URL("../web/.env.local", import.meta.url);
const SEARCH = "https://lite-api.jup.ag/tokens/v2/search";
const METADATA_PROGRAM = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");
const TOKEN_PROGRAMS = new Set([
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
]);

const PROVIDER_SHAPE = {
  xstocks: { suffix: "x" },
  ondo: { suffix: "on" },
};

export function loadEnv(text, env = process.env) {
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match || env[match[1]]) continue;
    env[match[1]] = match[2].replace(/^(['"])(.*)\1$/, "$2");
  }
  return env;
}

export function parseArgs(argv) {
  const args = { symbols: null, dryRun: false, list: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--list") args.list = true;
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--symbols") args.symbols = parseSymbols(argv[++i]);
    else if (arg.startsWith("--symbols=")) args.symbols = parseSymbols(arg.slice(10));
    else throw new Error(`unknown argument ${arg}`);
  }
  if (!args.list && !args.symbols?.length) throw new Error("name the tickers with --symbols META,AVGO, or pass --list");
  return args;
}

function parseSymbols(value = "") {
  return [...new Set(value.split(",").map(s => s.trim().toUpperCase()).filter(Boolean))];
}

export function validateSource(rows) {
  if (!Array.isArray(rows)) throw new Error("candidate source is not an array");
  for (const row of rows) {
    if (!row || typeof row.id !== "string" || typeof row.name !== "string" || typeof row.symbol !== "string") {
      throw new Error("candidate source contains a malformed token");
    }
    try { new PublicKey(row.id); } catch { throw new Error(`candidate source has a bad mint for ${row.symbol}`); }
    if (!Number.isInteger(row.decimals)) throw new Error(`candidate source has no decimals for ${row.symbol}`);
  }
  return rows;
}

export function selectCandidate(rows, tokenSymbol, mintAuthority) {
  const exact = validateSource(rows).filter(row => row.symbol === tokenSymbol && row.mintAuthority === mintAuthority);
  if (exact.length > 1) throw new Error(`candidate source returned two ${tokenSymbol} mints for authority ${mintAuthority}`);
  return exact[0] || null;
}

export function metadataPda(mint) {
  const key = new PublicKey(mint);
  return PublicKey.findProgramAddressSync([
    Buffer.from("metadata"), METADATA_PROGRAM.toBuffer(), key.toBuffer(),
  ], METADATA_PROGRAM)[0].toBase58();
}

function readBorshString(buffer, cursor) {
  if (cursor + 4 > buffer.length) throw new Error("truncated metadata string length");
  const length = buffer.readUInt32LE(cursor);
  const start = cursor + 4, end = start + length;
  if (end > buffer.length) throw new Error("truncated metadata string");
  return { value: buffer.subarray(start, end).toString("utf8").replace(/\0+$/, ""), cursor: end };
}

export function decodeMetaplexMetadata(encoded) {
  if (!encoded) return null;
  const buffer = Buffer.from(encoded, "base64");
  if (buffer.length < 65) throw new Error("Metaplex metadata account is too short");
  let cursor = 65;
  const name = readBorshString(buffer, cursor); cursor = name.cursor;
  const symbol = readBorshString(buffer, cursor);
  return { name: name.value, symbol: symbol.value };
}

export function parseMintAccount(value) {
  const info = value?.data?.parsed?.info;
  if (!info || !TOKEN_PROGRAMS.has(value.owner)) return null;
  const extension = info.extensions?.find(item => item.extension === "tokenMetadata")?.state;
  return {
    decimals: info.decimals,
    mintAuthority: info.mintAuthority ?? null,
    freezeAuthority: info.freezeAuthority ?? null,
    tokenProgram: value.owner,
    embeddedMetadata: extension ? { name: extension.name, symbol: extension.symbol } : null,
  };
}

export function reconcile(listed, onchain, provider) {
  if (!onchain) return { ok: false, why: "mint account is missing or is not an SPL mint" };
  if (!onchain.metadata) return { ok: false, why: "no Metaplex PDA or Token-2022 metadata" };
  if (onchain.mintAuthority !== provider.mintAuthority) {
    return { ok: false, why: `provider authority is ${provider.mintAuthority}, the mint says ${onchain.mintAuthority}` };
  }
  if (listed.mintAuthority && listed.mintAuthority !== onchain.mintAuthority) {
    return { ok: false, why: `catalogue mint authority is ${listed.mintAuthority}, the chain says ${onchain.mintAuthority}` };
  }
  if (listed.freezeAuthority !== undefined && listed.freezeAuthority !== onchain.freezeAuthority) {
    return { ok: false, why: `catalogue freeze authority is ${listed.freezeAuthority}, the chain says ${onchain.freezeAuthority}` };
  }
  if (listed.decimals !== onchain.decimals) {
    return { ok: false, why: `catalogue says ${listed.decimals} decimals, the chain says ${onchain.decimals}` };
  }
  if (listed.symbol !== onchain.metadata.symbol) {
    return { ok: false, why: `catalogue says ${listed.symbol}, the chain metadata says ${onchain.metadata.symbol}` };
  }
  if (listed.name !== onchain.metadata.name) {
    return { ok: false, why: `catalogue says ${listed.name}, the chain metadata says ${onchain.metadata.name}` };
  }
  return { ok: true, ...onchain };
}

export function merge(existing, incoming) {
  const output = structuredClone(existing);
  const mintOwner = new Map();
  for (const [symbol, entry] of Object.entries(output.symbols)) {
    for (const rep of entry.representations) mintOwner.set(rep.mint, symbol);
  }
  let added = 0, updated = 0;
  for (const rep of incoming) {
    const owner = mintOwner.get(rep.mint);
    if (owner && owner !== rep.symbol) throw new Error(`${rep.mint} is already carried as ${owner}, not ${rep.symbol}`);
    const entry = output.symbols[rep.symbol] ??= { referenceFeedId: null, representations: [] };
    const at = entry.representations.findIndex(current => current.mint === rep.mint);
    if (at === -1) { entry.representations.push(rep); added++; }
    else if (JSON.stringify(entry.representations[at]) !== JSON.stringify(rep)) { entry.representations[at] = rep; updated++; }
    mintOwner.set(rep.mint, rep.symbol);
    entry.representations.sort((a, b) => a.provider.localeCompare(b.provider));
  }
  return { data: output, added, updated };
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "vestail-token-sync (+https://vestail.fun)" } });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json();
}

async function search(tokenSymbol) {
  return validateSource(await fetchJson(`${SEARCH}?query=${encodeURIComponent(tokenSymbol)}`));
}

async function rpc(rpcUrl, method, params) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": "vestail-token-sync (+https://vestail.fun)" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (!response.ok) throw new Error(`Solana RPC returned ${response.status}`);
  const body = await response.json();
  if (body.error) throw new Error(`Solana RPC: ${body.error.message}`);
  return body.result;
}

export async function readOnchain(rpcUrl, mint) {
  const pda = metadataPda(mint);
  const [mintResult, metadataResult] = await Promise.all([
    rpc(rpcUrl, "getAccountInfo", [mint, { encoding: "jsonParsed", commitment: "confirmed" }]),
    rpc(rpcUrl, "getAccountInfo", [pda, { encoding: "base64", commitment: "confirmed" }]),
  ]);
  const parsed = parseMintAccount(mintResult.value);
  if (!parsed) return null;
  const pdaMetadata = decodeMetaplexMetadata(metadataResult.value?.data?.[0]);
  return {
    ...parsed,
    metadata: pdaMetadata || parsed.embeddedMetadata,
    metadataSource: pdaMetadata ? "metaplex-pda" : parsed.embeddedMetadata ? "token-2022-extension" : null,
    metadataPda: pda,
  };
}

function providerRecords() {
  const records = JSON.parse(readFileSync(PROVIDERS_FILE, "utf8"));
  return Object.fromEntries(Object.entries(PROVIDER_SHAPE).map(([id, shape]) => [id, { ...records[id], ...shape }]));
}

async function candidatesFor(symbols, providers) {
  const found = [];
  for (const symbol of symbols) {
    for (const [providerId, provider] of Object.entries(providers)) {
      const tokenSymbol = `${symbol}${provider.suffix}`;
      const candidate = selectCandidate(await search(tokenSymbol), tokenSymbol, provider.mintAuthority);
      if (candidate) found.push({ symbol, providerId, provider, listed: candidate });
    }
  }
  return found;
}

function toRepresentation(item, checked, fetchedAt) {
  const { symbol, providerId, provider, listed } = item;
  return {
    mint: listed.id,
    provider: providerId,
    symbol,
    name: checked.metadata.name,
    tokenSymbol: checked.metadata.symbol,
    structure: provider.structure,
    decimals: checked.decimals,
    redeemable: provider.redeemable,
    custodian: provider.custodian,
    source: provider.sourceUrl,
    fetchedAt,
    tokenProgram: checked.tokenProgram,
    mintAuthority: checked.mintAuthority,
    freezeAuthority: checked.freezeAuthority,
    pythFeedId: null,
  };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  try {
    if (existsSync(ENV_FILE)) loadEnv(readFileSync(ENV_FILE, "utf8"));
    const args = parseArgs(process.argv.slice(2));
    const providers = providerRecords();

    if (args.list) {
      for (const [providerId, provider] of Object.entries(providers)) {
        const rows = await search(providerId === "xstocks" ? "xStock" : "Ondo Tokenized");
        const verified = rows.filter(row => row.mintAuthority === provider.mintAuthority);
        for (const row of verified) process.stdout.write(`${providerId.padEnd(8)} ${row.symbol.padEnd(10)} ${row.name}\n`);
      }
      process.exit(0);
    }

    if (!process.env.SOLANA_RPC_URL) throw new Error("SOLANA_RPC_URL is required (set it in web/.env.local)");
    const candidates = await candidatesFor(args.symbols, providers);
    const requestedWithCandidate = new Set(candidates.map(item => item.symbol));
    const missing = args.symbols.filter(symbol => !requestedWithCandidate.has(symbol));
    const fresh = [], refused = [];
    const fetchedAt = new Date().toISOString();

    for (const item of candidates) {
      const result = reconcile(item.listed, await readOnchain(process.env.SOLANA_RPC_URL, item.listed.id), item.provider);
      process.stderr.write(`  ${result.ok ? "ok  " : "SKIP"} ${item.symbol.padEnd(7)} ${item.providerId.padEnd(8)} ${result.ok ? `${result.metadata.name} (${result.decimals} decimals; ${result.metadataSource})` : result.why}\n`);
      if (result.ok) fresh.push(toRepresentation(item, result, fetchedAt));
      else refused.push(`${item.symbol}/${item.providerId}`);
    }

    const verifiedSymbols = new Set(fresh.map(row => row.symbol));
    const unverified = args.symbols.filter(symbol => !verifiedSymbols.has(symbol));
    const file = JSON.parse(readFileSync(OUT, "utf8"));
    const merged = merge(file, fresh);
    process.stderr.write(`verified ${fresh.length} representations across ${verifiedSymbols.size} of ${args.symbols.length} requested symbols\n`);

    if (args.dryRun) process.stderr.write(`dry run: would add ${merged.added}, update ${merged.updated}\n`);
    else {
      writeFileSync(OUT, JSON.stringify(merged.data, null, 2) + "\n");
      process.stderr.write(`wrote ${merged.added} new and ${merged.updated} updated representations\n`);
    }

    if (missing.length) process.stderr.write(`no trusted catalogue candidate: ${missing.join(", ")}\n`);
    if (refused.length) process.stderr.write(`refused after chain verification: ${refused.join(", ")}\n`);
    if (unverified.length || refused.length) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  }
}
