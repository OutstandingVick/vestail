import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { json } from "./helpers.js";

test("GET /derivatives lists exactly gold, crude oil and copper as derivatives", async () => {
  const { body } = await json("/derivatives");
  assert.deepEqual(body.map(m => m.id), ["xyz:GOLD", "xyz:CL", "xyz:COPPER"]);
  assert.ok(body.every(m => m.instrument === "commodity_derivative"));
  assert.equal((await json("/derivatives?q=crude%20oil")).body[0].id, "xyz:CL");
});

test("a market is judged by the venue: US barred, NG conditional, GB not assessed", async () => {
  assert.equal((await json("/derivatives/xyz:GOLD?country=US")).body.status, "cannot_own");
  const ng = (await json("/derivatives/xyz:GOLD?country=NG")).body;
  assert.equal(ng.status, "conditional");
  assert.ok(ng.issuer.acknowledgement.limit.includes("owning"));
  const gb = (await json("/derivatives/xyz:GOLD?country=GB")).body;
  assert.equal(gb.assessed, false);
  assert.equal(gb.status, null);
  assert.equal((await json("/derivatives/xyz:NOPE?country=NG")).body.error.code, "unknown_market");
});

test("a derivative click needs the acknowledgement and is refused where barred or unassessed", async () => {
  const app = createApp({ apiKeys: ["k"], useSample: false });
  const click = body => app.request("/v1/orders/click", {
    method: "POST", headers: { Authorization: "Bearer k", "Content-Type": "application/json" }, body: JSON.stringify(body),
  }).then(async r => ({ status: r.status, body: await r.json() }));
  const gold = { country: "NG", asset: "xyz:GOLD", who: "citizen", venue: "Hyperliquid", market: "xyz:GOLD" };
  assert.equal((await click(gold)).body.error.code, "acknowledgement_required");
  const ok = await click({ ...gold, acknowledged: true });
  assert.equal(ok.status, 201);
  assert.equal(ok.body.redirect, "https://app.trade.xyz/trade/GOLD?ref=vestail");
  assert.equal((await click({ ...gold, country: "US", acknowledged: true })).body.error.code, "validation");
  assert.equal((await click({ ...gold, country: "GB", acknowledged: true })).body.error.code, "not_assessed");
});
