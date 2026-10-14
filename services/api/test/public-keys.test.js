import { test } from "node:test";
import assert from "node:assert/strict";
import { MemoryKeyStore } from "../src/public/key-store.js";

test("keys are returned once and only hashes are stored", async () => {
  const store = new MemoryKeyStore();
  const issued = await store.issue({ mode: "test", label: "Acme" });
  assert.match(issued.key, /^vst_test_/);
  assert.equal((await store.authenticate(issued.key)).id, issued.id);
  const state = await store.load();
  assert.equal(JSON.stringify(state).includes(issued.key), false);
  assert.equal(state.keys[0].hash.length, 64);
  assert.equal((await store.list())[0].hash, undefined);
});

test("live keys use their own prefix and revoked keys stop authenticating", async () => {
  const store = new MemoryKeyStore();
  const issued = await store.issue({ mode: "live" });
  assert.match(issued.key, /^vst_live_/);
  await store.revoke(issued.id);
  assert.equal(await store.authenticate(issued.key), null);
});
