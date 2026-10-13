import assert from "node:assert/strict";
import test from "node:test";

import { decodeString, decodeUint } from "./sync-robinhood-tokens.mjs";

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
