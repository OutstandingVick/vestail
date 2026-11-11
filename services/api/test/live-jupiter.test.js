import { test } from "node:test";
import assert from "node:assert/strict";
import { jupiterPairs } from "../src/live/jupiter.js";

const quote = (outAmount, labels, impact = "0.002") => async () => ({ ok: true, json: async () => ({ outAmount, priceImpactPct: impact, routePlan: labels.map(label => ({ swapInfo: { label } })) }) });

test("reports what a reference amount buys, the venues and price impact", async () => {
  const [usdc] = await jupiterPairs("Mint", 8, { pairs: ["USDC"], fetchImpl: quote("56000000", ["Meteora DLMM", "Meteora DLMM", "Orca"]) });
  assert.equal(usdc.available, true);
  assert.equal(usdc.reference.receive, 0.56);
  assert.ok(Math.abs(usdc.pricePerToken - 178.57) < 0.01);
  assert.deepEqual(usdc.venues, ["Meteora DLMM", "Orca"]);
  assert.ok(Math.abs(usdc.priceImpactPct - 0.2) < 1e-9);
});

test("no route and network failures are reported, not hidden", async () => {
  const [none] = await jupiterPairs("Mint", 8, { pairs: ["SOL"], fetchImpl: quote("0", []) });
  assert.equal(none.available, false);
  const [down] = await jupiterPairs("Mint", 8, { pairs: ["SOL"], fetchImpl: async () => { throw new Error("offline"); } });
  assert.equal(down.available, false);
  assert.match(down.note, /reach Jupiter/);
});
