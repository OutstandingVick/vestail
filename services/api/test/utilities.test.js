import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { MemoryKeyStore } from "../src/public/key-store.js";

// Live market reads are injected: the tests never call Jupiter or Meteora.
const live = {
  jupiter: async () => [{ pair: "USDC", available: true, reference: { spend: 100, spendSymbol: "USDC", receive: 0.56 }, pricePerToken: 178.5, priceImpactPct: 0.1, venues: ["Meteora DLMM"] }],
  meteora: async () => [{ address: "Pool1111", kind: "dlmm", name: "NVDAx-USDC", pair: "USDC", tvlUsd: 120000, volume24hUsd: 9000, fees24hUsd: 40, feeTvl24hPct: 0.03, feeAprPct: 10.95, binStep: 20, baseFeePct: 0.2 }],
};

async function fixture(liveOverride = live) {
  const store = new MemoryKeyStore();
  const issued = await store.issue({ label: "test", rateLimit: 100 });
  const app = createApp({ partnerKeyStore: store, partnerAccessNow: () => 0, live: liveOverride });
  return (q) => app.request(`/api/v1/utilities?${new URLSearchParams(q)}`, { headers: { Authorization: `Bearer ${issued.key}` } })
    .then(async r => ({ status: r.status, body: await r.json() }));
}
const pick = (body, issuer, utility) => body.versions.find(v => v.asset.issuer === issuer).utilities.find(u => u.utility === utility);

test("returns every NVDA version with all five utilities and live numbers", async () => {
  const get = await fixture();
  const { status, body } = await get({ asset: "NVDA", country: "NG", residency: "citizen" });
  assert.equal(status, 200);
  assert.ok(body.versions.length >= 2);
  const v = body.versions.find(x => x.asset.issuer === "xstocks");
  assert.deepEqual(v.utilities.map(u => u.utility), ["hold", "trade", "lend", "borrow", "earn"]);
  const earn = pick(body, "xstocks", "earn");
  assert.equal(earn.options[0].live.depthUsd, 120000);
  assert.equal(pick(body, "xstocks", "trade").options[0].live.pairs[0].venues[0], "Meteora DLMM");
});

test("verdicts combine the issuer rule and the protocol rule, most restrictive first", async () => {
  const get = await fixture();
  const ng = (await get({ asset: "NVDA", country: "NG", residency: "citizen" })).body;
  // xStocks is conditional in Nigeria; Jupiter and Meteora are eligible there: conditional wins.
  assert.equal(pick(ng, "xstocks", "hold").verdict, "conditional");
  assert.equal(pick(ng, "xstocks", "trade").verdict, "conditional");
  assert.equal(pick(ng, "xstocks", "earn").verdict, "conditional");
  // In the US the issuer and both protocols restrict: restricted, actions off, no live reads.
  const us = (await get({ asset: "NVDA", country: "US", residency: "citizen" })).body;
  const trade = pick(us, "xstocks", "trade");
  assert.equal(trade.verdict, "restricted");
  assert.equal(trade.actionsEnabled, false);
  assert.equal(trade.options[0].live, null);
});

test("unverified protocols and residents get no actions", async () => {
  const get = await fixture();
  const ng = (await get({ asset: "NVDA", country: "NG", residency: "citizen" })).body;
  for (const u of ["lend", "borrow"]) {
    const x = pick(ng, "xstocks", u);
    assert.equal(x.verdict, "unverified");
    assert.equal(x.actionsEnabled, false);
  }
  const resident = (await get({ asset: "NVDA", country: "NG", residency: "resident" })).body;
  assert.ok(pick(resident, "xstocks", "earn").verdict === "unverified" && !pick(resident, "xstocks", "earn").actionsEnabled);
});

test("earn requires a risk acknowledgement, and no perps utility exists", async () => {
  const get = await fixture();
  const ng = (await get({ asset: "NVDA", country: "NG", residency: "citizen" })).body;
  const earn = pick(ng, "xstocks", "earn");
  assert.equal(earn.risk, "impermanent_loss");
  assert.equal(earn.acknowledgementRequired, true);
  const names = ng.versions.flatMap(v => v.utilities.map(u => u.utility));
  assert.ok(names.every(n => ["hold", "trade", "lend", "borrow", "earn"].includes(n)));
  assert.ok(!JSON.stringify(ng).match(/perp|leverage/i));
});

test("a failing live source leaves the verdict intact and says why", async () => {
  const get = await fixture({ ...live, meteora: async () => { throw new Error("Meteora damm_v2 returned HTTP 503"); } });
  const ng = (await get({ asset: "NVDA", country: "NG", residency: "citizen" })).body;
  const earn = pick(ng, "xstocks", "earn");
  assert.equal(earn.verdict, "conditional");
  assert.equal(earn.options[0].live, null);
  assert.match(earn.options[0].liveError, /503/);
});

test("bad queries are refused, and the endpoint needs a key", async () => {
  const get = await fixture();
  assert.equal((await get({ asset: "NOPE", country: "NG", residency: "citizen" })).status, 400);
  assert.equal((await get({ asset: "NVDA", country: "XX", residency: "citizen" })).status, 400);
  assert.equal((await get({ asset: "NVDA", country: "NG", residency: "tourist" })).status, 400);
  const app = createApp({ partnerKeyStore: new MemoryKeyStore(), live });
  assert.equal((await app.request("/api/v1/utilities?asset=NVDA&country=NG&residency=citizen")).status, 401);
});
