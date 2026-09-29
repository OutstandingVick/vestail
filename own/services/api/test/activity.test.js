import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { createClickLog } from "../src/clicks.js";

const call = async (app, path) => { const res = await app.request(`/v1${path}`); return { res, body: await res.json() }; };

test("outside production /activity serves the sample and is never cached", async () => {
  const { res, body } = await call(createApp({ useSample: true }), "/activity");
  assert.equal(res.status, 200);
  assert.equal(res.headers.get("cache-control"), "no-store");
  assert.equal(body.stats.volume_30d_usd, 48300000);
  assert.ok(body.recent.length > 0);
});

test("in production the sample figures never appear", async () => {
  const { body } = await call(createApp({ useSample: false }), "/activity");
  assert.deepEqual(body.stats, { volume_30d_usd: 0, volume_30d_delta_pct: 0, orders_routed: 0, orders_delta_pct: 0, active_buyers_7d: 0 });
  assert.deepEqual(body.recent, []);
});

test("recorded clicks lead the feed", async () => {
  let t = 1_000_000;
  const clicks = createClickLog({ now: () => t });
  clicks.record({ country: "NG", asset: "cryptocurrency", who: "citizen", venue: "Luno", session: "s1" });
  t += 5 * 60 * 1000;
  const { body } = await call(createApp({ clicks, useSample: false }), "/activity");
  assert.equal(body.stats.orders_routed, 1);
  assert.equal(body.stats.active_buyers_7d, 1);
  assert.deepEqual(body.recent[0], { flag: "🇳🇬", asset: "Cryptocurrency", venue: "Luno", ago: "5m ago" });
});
