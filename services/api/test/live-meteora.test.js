import { test } from "node:test";
import assert from "node:assert/strict";
import { depthUsd, meteoraPools, QUOTE_MINTS, shapePool } from "../src/live/meteora.js";

const NVDAX = "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh";
const pool = (address, other, tvl, extra = {}) => ({
  address, name: "p", token_x: { address: NVDAX }, token_y: { address: other }, tvl,
  volume: { "24h": 1000 }, fees: { "24h": 10 }, fee_tvl_ratio: { "24h": 0.5 }, pool_config: { bin_step: 20, base_fee_pct: 0.2 }, ...extra,
});
const fakeFetch = pools => async () => ({ ok: true, json: async () => ({ data: pools }) });

test("keeps only USDC and SOL pairs, deepest first", async () => {
  const pools = await meteoraPools(NVDAX, { kinds: ["dlmm"], fetchImpl: fakeFetch([
    pool("a", QUOTE_MINTS.SOL, 100), pool("b", "MemeTokenMint1111111111111111111111111111", 9999), pool("c", QUOTE_MINTS.USDC, 500),
  ]) });
  assert.deepEqual(pools.map(p => p.address), ["c", "a"]);
  assert.equal(pools[0].pair, "USDC");
  assert.equal(depthUsd(pools), 600);
});

test("annualises Meteora's 24h fee/TVL percentage and drops blacklisted pools", () => {
  const p = shapePool("dlmm", pool("a", QUOTE_MINTS.USDC, 100), NVDAX, ["USDC"]);
  assert.equal(p.feeTvl24hPct, 0.5);
  assert.equal(p.feeAprPct, 182.5);
  assert.equal(shapePool("dlmm", pool("a", QUOTE_MINTS.USDC, 100, { is_blacklisted: true }), NVDAX, ["USDC"]), null);
});

test("a failing Meteora API surfaces as an error, not empty data", async () => {
  await assert.rejects(meteoraPools(NVDAX, { kinds: ["dlmm"], fetchImpl: async () => ({ ok: false, status: 503 }) }), /HTTP 503/);
});
