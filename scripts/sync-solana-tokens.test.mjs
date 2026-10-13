import assert from "node:assert/strict";
import test from "node:test";
import { PublicKey } from "@solana/web3.js";

import {
  decodeMetaplexMetadata,
  loadEnv,
  merge,
  metadataPda,
  parseArgs,
  parseMintAccount,
  reconcile,
  selectCandidate,
  validateSource,
} from "./sync-solana-tokens.mjs";

const mint = "Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu";
const authority = "7pt9tkctJPK7PPNQJ77GKg8ZffSF6QxoMiCFYHxrtaCj";
const freeze = "JDq14BWvqCRFNu1krb12bcRpbGtJZ1FLEakMw6FdxJNs";
const candidate = { id: mint, name: "Meta xStock", symbol: "METAx", decimals: 8, mintAuthority: authority, freezeAuthority: freeze };

test("reads env files without replacing an explicit process value", () => {
  const env = { SOLANA_RPC_URL: "already-set" };
  loadEnv("SOLANA_RPC_URL=from-file\nOTHER='value'\n# ignored", env);
  assert.deepEqual(env, { SOLANA_RPC_URL: "already-set", OTHER: "value" });
});

test("requires an explicit mode and normalizes requested symbols", () => {
  assert.throws(() => parseArgs([]), /--symbols/);
  assert.deepEqual(parseArgs(["--symbols", "meta, avgo,META"]).symbols, ["META", "AVGO"]);
  assert.equal(parseArgs(["--symbols=meta", "--dry-run"]).dryRun, true);
  assert.equal(parseArgs(["--list"]).list, true);
  assert.throws(() => parseArgs(["--all"]), /unknown argument/);
});

test("refuses malformed catalogue rows", () => {
  assert.throws(() => validateSource({}), /not an array/);
  assert.throws(() => validateSource([{ ...candidate, id: "not-base58" }]), /bad mint/);
  assert.throws(() => validateSource([{ ...candidate, decimals: null }]), /no decimals/);
});

test("selects only the exact symbol issued by the expected authority", () => {
  const impostor = { ...candidate, id: "So11111111111111111111111111111111111111112", mintAuthority: "someone-else" };
  assert.deepEqual(selectCandidate([impostor, candidate], "METAx", authority), candidate);
  assert.equal(selectCandidate([impostor], "METAx", authority), null);
});

test("refuses two trusted catalogue rows for the same token symbol", () => {
  const duplicate = { ...candidate, id: "So11111111111111111111111111111111111111112" };
  assert.throws(() => selectCandidate([candidate, duplicate], "METAx", authority), /returned two METAx mints/);
});

test("derives the canonical Metaplex metadata PDA", () => {
  assert.equal(metadataPda(mint), "HCMyzTzo5e9NjRhSeUuBUtPfiTDnSCpL2c2uzRdhPkuL");
  assert.doesNotThrow(() => new PublicKey(metadataPda(mint)));
});

function borshString(value) {
  const bytes = Buffer.from(value);
  const length = Buffer.alloc(4); length.writeUInt32LE(bytes.length);
  return Buffer.concat([length, bytes]);
}

test("decodes name and symbol from a Metaplex metadata account", () => {
  const bytes = Buffer.concat([Buffer.alloc(65), borshString("Meta xStock\0\0"), borshString("METAx\0")]);
  assert.deepEqual(decodeMetaplexMetadata(bytes.toString("base64")), { name: "Meta xStock", symbol: "METAx" });
  assert.equal(decodeMetaplexMetadata(null), null);
});

test("refuses truncated Metaplex metadata instead of filling gaps", () => {
  const bytes = Buffer.concat([Buffer.alloc(65), borshString("Meta xStock")]);
  assert.throws(() => decodeMetaplexMetadata(bytes.toString("base64")), /truncated metadata string length/);
});

test("reads decimals, authorities and Token-2022 metadata from a mint account", () => {
  const parsed = parseMintAccount({ owner: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", data: { parsed: { info: {
    decimals: 8, mintAuthority: authority, freezeAuthority: freeze,
    extensions: [{ extension: "tokenMetadata", state: { name: "Meta xStock", symbol: "METAx" } }],
  } } } });
  assert.deepEqual(parsed, { decimals: 8, mintAuthority: authority, freezeAuthority: freeze,
    tokenProgram: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", embeddedMetadata: { name: "Meta xStock", symbol: "METAx" } });
  assert.equal(parseMintAccount({ owner: "11111111111111111111111111111111", data: {} }), null);
});

const provider = { mintAuthority: authority };
const live = { decimals: 8, mintAuthority: authority, freezeAuthority: freeze, tokenProgram: "Tokenz", metadata: { name: "Meta xStock", symbol: "METAx" } };

test("accepts a candidate only when catalogue and chain agree", () => {
  assert.equal(reconcile(candidate, live, provider).ok, true);
  assert.match(reconcile({ ...candidate, symbol: "FAKEx" }, live, provider).why, /catalogue says FAKEx/);
  assert.match(reconcile(candidate, { ...live, mintAuthority: "wrong" }, provider).why, /provider authority/);
  assert.match(reconcile(candidate, { ...live, metadata: null }, provider).why, /no Metaplex PDA or Token-2022 metadata/);
});

test("refuses freeze authority drift", () => {
  assert.match(reconcile(candidate, { ...live, freezeAuthority: "unexpected" }, provider).why, /catalogue freeze authority/);
});

test("refuses decimal drift", () => {
  assert.match(reconcile(candidate, { ...live, decimals: 6 }, provider).why, /catalogue says 8 decimals/);
});

const representation = (symbol, tokenMint = mint) => ({ mint: tokenMint, provider: "xstocks", symbol, name: `${symbol} xStock`, tokenSymbol: `${symbol}x` });

test("merges additively without losing existing symbols", () => {
  const existing = { symbols: { NVDA: { referenceFeedId: null, representations: [representation("NVDA", "Xs9mBfHkGqv8QZ9fWnDtK7uE2Rj3Pc5La6VxYw1AbCd")] } } };
  const result = merge(existing, [representation("META")]);
  assert.equal(result.added, 1);
  assert.deepEqual(Object.keys(result.data.symbols), ["NVDA", "META"]);
  assert.equal(existing.symbols.META, undefined);
});

test("a mint cannot quietly move from one symbol to another", () => {
  const existing = { symbols: { META: { referenceFeedId: null, representations: [representation("META")] } } };
  assert.throws(() => merge(existing, [representation("AVGO")]), /already carried as META/);
});
