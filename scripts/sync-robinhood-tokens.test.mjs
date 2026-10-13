import assert from "node:assert/strict";
import test from "node:test";

import { decodeString, decodeUint, merge, parseArgs, reconcile, validate } from "./sync-robinhood-tokens.mjs";

/*
 * The decoders are the part of the syncer that can be wrong quietly. A bad
 * fetch throws and stops the run; a bad decode writes a plausible-looking row
 * with the wrong ticker on it, which is the failure this product can least
 * afford. So they are pure functions, exported, and tested against bytes taken
 * off the chain rather than invented.
 */

/** NVDA's real symbol() response, read from 0xd0601CE1… on Robinhood Chain. */
const NVDA_SYMBOL =
  "0x0000000000000000000000000000000000000000000000000000000000000020" +
  "0000000000000000000000000000000000000000000000000000000000000004" +
  "4e56444100000000000000000000000000000000000000000000000000000000";

test("decodes a standard string return", () => {
  assert.equal(decodeString(NVDA_SYMBOL), "NVDA");
});

test("decodes a bytes32 return from a token that predates the standard", () => {
  const bytes32 = "0x" + Buffer.from("TSLA").toString("hex").padEnd(64, "0");
  assert.equal(decodeString(bytes32), "TSLA");
});

test("an empty response is nothing, not an empty string", () => {
  assert.equal(decodeString("0x"), null);
  assert.equal(decodeString(undefined), null);
  assert.equal(decodeUint("0x"), null);
});

test("decodes decimals", () => {
  assert.equal(decodeUint("0x0000000000000000000000000000000000000000000000000000000000000012"), 18);
  assert.equal(decodeUint("0x0000000000000000000000000000000000000000000000000000000000000008"), 8);
});

test("a number too large to be a decimals value is refused, not rounded", () => {
  assert.equal(decodeUint("0x" + "f".repeat(64)), null);
});

test("refuses a token the registry and the chain disagree about", () => {
  const listed = { tokenName: "NVIDIA • Robinhood Token" };
  const r = reconcile("NVDA", listed, { symbol: "TSLA", name: "Tesla", decimals: 18 });
  assert.equal(r.ok, false);
  assert.match(r.why, /registry says NVDA, the contract says TSLA/);
});

test("refuses an address with nothing behind it", () => {
  assert.equal(reconcile("NVDA", {}, null).ok, false);
});

test("refuses a token that cannot say how many decimals it has", () => {
  const r = reconcile("NVDA", { tokenName: "x" }, { symbol: "NVDA", name: "x", decimals: null });
  assert.equal(r.ok, false);
});

test("takes the display name from the registry and the decimals from the chain", () => {
  const r = reconcile("NVDA", { tokenName: "NVIDIA • Robinhood Token" }, { symbol: "NVDA", name: "whatever", decimals: 18 });
  assert.deepEqual(r, { ok: true, symbol: "NVDA", name: "NVIDIA • Robinhood Token", decimals: 18 });
});

const row = (chain, address, symbol) => ({
  chain, address, provider: "robinhood", symbol, name: symbol, tokenSymbol: symbol,
  decimals: 18, structure: "tokenized_debt", redeemable: false, custodian: null, source: "x",
});

test("leaves other chains alone", () => {
  const base = { ...row("base", "0xbb", "NVDA"), provider: "coinbase" };
  const { rows, added } = merge([base], [row("robinhood", "0xaa", "NVDA")]);
  assert.equal(added, 1);
  assert.equal(rows.length, 2);
  assert.ok(rows.some(r => r.chain === "base" && r.provider === "coinbase"));
});

test("the same address in different capitalisation is one token", () => {
  const { rows, added } = merge(
    [row("robinhood", "0xAbCdEf0123456789012345678901234567890123", "NVDA")],
    [row("robinhood", "0xabcdef0123456789012345678901234567890123", "NVDA")],
  );
  // Not added twice: a buyer must never be offered the same contract as two
  // options. The incoming row wins, so the casing settles on the registry's.
  assert.equal(added, 0);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].address, "0xabcdef0123456789012345678901234567890123");
});

test("re-syncing an unchanged token reports no change", () => {
  const existing = [row("robinhood", "0xaa", "NVDA")];
  const { added, updated } = merge(existing, [row("robinhood", "0xaa", "NVDA")]);
  assert.equal(added + updated, 0);
});

test("orders by chain then ticker, so a diff reads as a list of tokens", () => {
  const { rows } = merge([], [
    row("robinhood", "0x02", "TSLA"), row("base", "0x03", "NVDA"), row("robinhood", "0x01", "AAPL"),
  ]);
  assert.deepEqual(rows.map(r => `${r.chain}:${r.symbol}`), ["base:NVDA", "robinhood:AAPL", "robinhood:TSLA"]);
});

test("stops on a registry that is not the shape it should be", () => {
  assert.throws(() => validate(null), /no assets array/);
  assert.throws(() => validate({ assets: [] }), /empty/);
  assert.throws(
    () => validate({ assets: [{ id: "x", tokenSymbol: "NVDA", tokenName: "NVIDIA", deployments: [{ chainId: 4663, contractAddress: "nonsense" }] }] }),
    /bad address/,
  );
});

test("a deployment on another chain is not held to this chain's address rule", () => {
  const ok = validate({ assets: [{ id: "x", tokenSymbol: "NVDA", tokenName: "NVIDIA", deployments: [{ chainId: 1, contractAddress: "whatever" }] }] });
  assert.equal(ok.length, 1);
});

test("makes the caller choose", () => {
  assert.throws(() => parseArgs([]), /--symbols/);
  assert.deepEqual(parseArgs(["--symbols", "nvda,tsla"]).symbols, ["NVDA", "TSLA"]);
  assert.deepEqual(parseArgs(["--symbols=nvda, tsla"]).symbols, ["NVDA", "TSLA"]);
  assert.equal(parseArgs(["--all"]).all, true);
  assert.equal(parseArgs(["--all", "--dry-run"]).dryRun, true);
  assert.throws(() => parseArgs(["--wat"]), /unknown argument/);
});
