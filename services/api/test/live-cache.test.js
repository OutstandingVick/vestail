import { test } from "node:test";
import assert from "node:assert/strict";
import { createLiveCache } from "../src/live/cache.js";

test("serves a value until it expires, sharing concurrent loads", async () => {
  let t = 0, calls = 0;
  const cached = createLiveCache({ ttlMs: 100, now: () => t });
  const load = async () => ++calls;
  assert.deepEqual(await Promise.all([cached("k", load), cached("k", load)]), [1, 1]);
  t = 50; assert.equal(await cached("k", load), 1);
  t = 150; assert.equal(await cached("k", load), 2);
});

test("doesn't cache failures", async () => {
  const cached = createLiveCache();
  await assert.rejects(cached("k", async () => { throw new Error("down"); }));
  assert.equal(await cached("k", async () => "up"), "up");
});
