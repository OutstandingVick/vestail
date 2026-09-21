#!/usr/bin/env node
/**
 * Regenerates registry/representations.json: every onchain representation of
 * every allowlisted symbol, pinned to its issuer.
 *
 *   npm run registry:sync
 *
 * Why a committed file instead of a runtime symbol search: a token symbol
 * proves nothing. Searching "NVDAx" returns the real xStock next to several
 * pump.fun tokens with the same symbol. So discovery happens here, offline,
 * with per-issuer proof, and the result is reviewed as a git diff like any
 * other claim Vestail makes.
 *
 * Proof per provider:
 *   xstocks, ondo  onchain mint authority equals the issuer's single known
 *                  authority (registry/providers.json)
 *   prestocks,     the mint is listed by the issuer's own API
 *   tessera
 *   backpack       Jupiter's `verified` + `backpack` tags and the
 *                  "- Backpack Securities" name suffix. Weaker than the rest:
 *                  Backpack uses a different mint authority per token and
 *                  publishes no mint list we have found. Recorded as such.
 *
 * Every mint is then checked onchain: it must exist, be owned by the SPL
 * Token or Token-2022 program, and have the decimals the metadata claims.
 * Any mismatch aborts the run rather than writing a half-true registry.
 */

import { readFileSync, writeFileSync } from "node:fs";

const { SYMBOL_ALLOWLIST, PRIVATE_SYMBOLS } = await import(
  new URL("../lib/constants.ts", import.meta.url)
);

const providers = JSON.parse(
  readFileSync(new URL("../registry/providers.json", import.meta.url), "utf8"),
);

const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL?.trim() ||
  "https://api.mainnet-beta.solana.com";
const JUPITER = "https://api.jup.ag";
const PYTH = "https://pyth.dourolabs.app/hermes";

const TOKEN_PROGRAMS = new Set([
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
]);

/** Issuer tickers that differ from the listed ticker Vestail uses. */
const PRESTOCKS_SYMBOLS = { SPACEX: "SPCX", OPENAI: "OPENAI", KALSHI: "KALSHI" };
const TESSERA_SYMBOLS = { tSpaceX: "SPCX", tOpenAI: "OPENAI", tKalshi: "KALSHI" };

/* -------------------------------------------------------------------------- */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Keyless Jupiter allows only a handful of requests before returning 429, so
 * rate limits are retried with backoff (honouring Retry-After) instead of
 * failing the run. Anything else non-2xx still fails immediately.
 */
async function getJson(url, init, attempt = 0) {
  const res = await fetch(url, init);
  if (res.status === 429 && attempt < 6) {
    const retryAfter = Number(res.headers.get("retry-after"));
    const wait = retryAfter > 0 ? retryAfter * 1000 : 1000 * 2 ** attempt;
    process.stderr.write(`  429 from ${new URL(url).host}, retrying in ${wait}ms\n`);
    await sleep(wait);
    return getJson(url, init, attempt + 1);
  }
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} from ${url}`);
  return res.json();
}

const jupiterHeaders = process.env.JUPITER_API_KEY?.trim()
  ? { "x-api-key": process.env.JUPITER_API_KEY.trim() }
  : {};

async function jupiterSearch(query) {
  await sleep(jupiterHeaders["x-api-key"] ? 0 : 400);
  return getJson(
    `${JUPITER}/tokens/v2/search?query=${encodeURIComponent(query)}`,
    { headers: jupiterHeaders },
  );
}

/** Jupiter's search accepts up to 100 comma-separated mints. */
async function jupiterByMint(mints) {
  const out = new Map();
  for (let i = 0; i < mints.length; i += 100) {
    for (const t of await jupiterSearch(mints.slice(i, i + 100).join(","))) {
      out.set(t.id, t);
    }
  }
  return out;
}

async function rpcMints(mints) {
  const body = {
    jsonrpc: "2.0",
    id: 1,
    method: "getMultipleAccounts",
    params: [mints, { encoding: "jsonParsed" }],
  };
  const { result, error } = await getJson(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (error) throw new Error(`RPC error: ${JSON.stringify(error)}`);
  return new Map(mints.map((m, i) => [m, result.value[i]]));
}

/** Exactly one match or a loud failure — never a silent guess. */
function one(matches, what) {
  if (matches.length > 1) {
    throw new Error(
      `${what}: ${matches.length} candidates (${matches.map((t) => t.id).join(", ")}); refusing to guess`,
    );
  }
  return matches[0];
}

/* -------------------------------------------------------------------------- */
/* Discovery                                                                   */
/* -------------------------------------------------------------------------- */

const candidates = []; // { symbol, provider, mint }
const publicSymbols = SYMBOL_ALLOWLIST.filter((s) => !PRIVATE_SYMBOLS.has(s));

for (const symbol of publicSymbols) {
  const xs = one(
    (await jupiterSearch(`${symbol}x`)).filter(
      (t) =>
        t.symbol === `${symbol}x` &&
        t.mintAuthority === providers.xstocks.mintAuthority,
    ),
    `xstocks ${symbol}`,
  );
  if (xs) candidates.push({ symbol, provider: "xstocks", mint: xs.id });

  const on = one(
    (await jupiterSearch(`${symbol}on`)).filter(
      (t) =>
        t.symbol === `${symbol}on` &&
        t.mintAuthority === providers.ondo.mintAuthority,
    ),
    `ondo ${symbol}`,
  );
  if (on) candidates.push({ symbol, provider: "ondo", mint: on.id });

  const bp = one(
    (await jupiterSearch(symbol)).filter(
      (t) =>
        t.symbol === symbol &&
        t.tags?.includes("backpack") &&
        t.tags?.includes("verified") &&
        t.name.endsWith(" - Backpack Securities"),
    ),
    `backpack ${symbol}`,
  );
  if (bp) candidates.push({ symbol, provider: "backpack", mint: bp.id });
}

for (const t of await getJson("https://prestocks.com/api/prestocks")) {
  const symbol = PRESTOCKS_SYMBOLS[t.symbol];
  if (symbol && SYMBOL_ALLOWLIST.includes(symbol)) {
    candidates.push({ symbol, provider: "prestocks", mint: t.contract_address });
  }
}

for (const t of await getJson(
  "https://rest-api.tessera.pe/v1/public/token-details",
)) {
  const symbol = TESSERA_SYMBOLS[t.code];
  if (symbol && SYMBOL_ALLOWLIST.includes(symbol)) {
    candidates.push({ symbol, provider: "tessera", mint: t.mint });
  }
}

/* -------------------------------------------------------------------------- */
/* Verification                                                                */
/* -------------------------------------------------------------------------- */

const mints = candidates.map((c) => c.mint);
const meta = await jupiterByMint(mints);
const chain = await rpcMints(mints);

for (const c of candidates) {
  const m = meta.get(c.mint);
  const acct = chain.get(c.mint);
  const where = `${c.provider} ${c.symbol} ${c.mint}`;

  if (!m) throw new Error(`${where}: no Jupiter metadata`);
  if (!acct) throw new Error(`${where}: mint account does not exist onchain`);
  if (!TOKEN_PROGRAMS.has(acct.owner)) {
    throw new Error(`${where}: owned by ${acct.owner}, not a token program`);
  }
  const info = acct.data?.parsed?.info;
  if (acct.data?.parsed?.type !== "mint" || !info) {
    throw new Error(`${where}: account is not a mint`);
  }
  if (info.decimals !== m.decimals) {
    throw new Error(
      `${where}: onchain decimals ${info.decimals} != metadata ${m.decimals}`,
    );
  }
  const expectedAuthority = providers[c.provider].mintAuthority;
  if (expectedAuthority && info.mintAuthority !== expectedAuthority) {
    throw new Error(
      `${where}: onchain mint authority ${info.mintAuthority} is not the issuer's`,
    );
  }

  c.chain = { program: acct.owner, info };
  c.meta = m;
}

/* -------------------------------------------------------------------------- */
/* Pyth feeds                                                                  */
/* -------------------------------------------------------------------------- */

// Feed discovery is keyless; only price reads need PYTH_API_KEY.
const feeds = new Map(
  (await getJson(`${PYTH}/v2/price_feeds`)).map((f) => [
    f.attributes.symbol,
    `0x${f.id.replace(/^0x/, "")}`,
  ]),
);

/** Pyth's feed for the token itself, where one exists. */
function tokenFeed(provider, symbol) {
  if (provider === "xstocks") return feeds.get(`Crypto.${symbol}X/USD`) ?? null;
  if (provider === "ondo") return feeds.get(`Crypto.${symbol}ON/USD`) ?? null;
  return null;
}

/* -------------------------------------------------------------------------- */
/* Write                                                                       */
/* -------------------------------------------------------------------------- */

const PROVIDER_ORDER = ["xstocks", "backpack", "ondo", "tessera", "prestocks"];
const generatedAt = new Date().toISOString();

const symbols = {};
for (const symbol of SYMBOL_ALLOWLIST) {
  const reps = candidates
    .filter((c) => c.symbol === symbol)
    .sort(
      (a, b) =>
        PROVIDER_ORDER.indexOf(a.provider) - PROVIDER_ORDER.indexOf(b.provider),
    )
    .map((c) => {
      const p = providers[c.provider];
      return {
        mint: c.mint,
        provider: c.provider,
        symbol,
        name: c.meta.name,
        tokenSymbol: c.meta.symbol,
        structure: p.structure,
        decimals: c.chain.info.decimals,
        redeemable: p.redeemable,
        custodian: p.custodian,
        source: p.sourceUrl,
        fetchedAt: generatedAt,
        tokenProgram: c.chain.program,
        mintAuthority: c.chain.info.mintAuthority ?? null,
        freezeAuthority: c.chain.info.freezeAuthority ?? null,
        pythFeedId: tokenFeed(c.provider, symbol),
      };
    });

  symbols[symbol] = {
    referenceFeedId: PRIVATE_SYMBOLS.has(symbol)
      ? null
      : (feeds.get(`Equity.US.${symbol}/USD`) ?? null),
    representations: reps,
  };
}

writeFileSync(
  new URL("../registry/representations.json", import.meta.url),
  `${JSON.stringify({ generatedAt, symbols }, null, 2)}\n`,
);

for (const [symbol, { referenceFeedId, representations }] of Object.entries(
  symbols,
)) {
  console.log(
    `${symbol.padEnd(7)} ref=${referenceFeedId ? "pyth" : "none"}  ${representations
      .map((r) => `${r.provider}:${r.tokenSymbol}`)
      .join("  ")}`,
  );
}
console.log(`\n${candidates.length} representations written.`);
