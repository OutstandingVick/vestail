import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { rateLimit } from "../src/ratelimit.js";

test("reads past the limit get 429 rate_limited until the window resets", async () => {
  let t = 0, ip = "1.1.1.1";
  const app = createApp({ limiter: rateLimit({ limit: 2, windowMs: 1000, ipOf: () => ip, now: () => t }) });
  const get = () => app.request("/v1/assets");

  assert.equal((await get()).headers.get("RateLimit-Remaining"), "1");
  assert.equal((await get()).status, 200);
  const blocked = await get();
  assert.equal(blocked.status, 429);
  assert.equal((await blocked.json()).error.code, "rate_limited");
  assert.equal(blocked.headers.get("Retry-After"), "1");

  ip = "2.2.2.2";
  assert.equal((await get()).status, 200, "other IPs are unaffected");
  ip = "1.1.1.1"; t = 1000;
  assert.equal((await get()).status, 200, "window resets");
});

test("POST is not counted against the read limit", async () => {
  const app = createApp({ apiKeys: [], limiter: rateLimit({ limit: 0, ipOf: () => "x" }) });
  const res = await app.request("/v1/orders/click", { method: "POST", body: "{}" });
  assert.equal(res.status, 401);
});
