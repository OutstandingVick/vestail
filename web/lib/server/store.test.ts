import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test, { afterEach } from "node:test";

import { readUser, withSnapshot, writeUser } from "./store.ts";

const ENV = ["KV_REST_API_URL", "KV_REST_API_TOKEN", "VESTAIL_DATA_DIR"];
const saved = Object.fromEntries(ENV.map(k => [k, process.env[k]]));
const realFetch = globalThis.fetch;

afterEach(() => {
  for (const k of ENV) { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; }
  globalThis.fetch = realFetch;
});

/** A KV stand-in that answers GET and SET over the REST shape the helper uses. */
function fakeKv(store = new Map<string, string>(), failing = false) {
  const calls: string[][] = [];
  process.env.KV_REST_API_URL = "https://kv.test";
  process.env.KV_REST_API_TOKEN = "token";
  globalThis.fetch = (async (_url: string, init: { body: string }) => {
    const command = JSON.parse(init.body) as string[];
    calls.push(command);
    if (failing) return new Response("nope", { status: 500 });
    const [verb, key, value] = command;
    if (verb === "SET") { store.set(key, value); return Response.json({ result: "OK" }); }
    return Response.json({ result: store.get(key) ?? null });
  }) as typeof fetch;
  return { store, calls };
}

test("writes to KV, not the filesystem, when KV is configured", async () => {
  const { store, calls } = fakeKv();
  await writeUser("did:privy:abc", { watchlist: [{ asset: "Gold", added: "2026-10-12" }], snapshots: [] });

  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], "SET");
  assert.equal(calls[0][1], "vestail:user:did_privy_abc");
  assert.equal(store.size, 1);
});

test("reads back what it wrote through KV", async () => {
  fakeKv();
  const data = { watchlist: [{ asset: "Farmland", symbol: "LAND", added: "2026-10-12" }], snapshots: [{ day: "2026-10-12", usd: 1200 }] };
  await writeUser("u1", data);
  assert.deepEqual(await readUser("u1"), data);
});

test("an unknown user is empty, not an error", async () => {
  fakeKv();
  assert.deepEqual(await readUser("nobody"), { watchlist: [], snapshots: [] });
});

test("a failing KV throws rather than silently dropping the write", async () => {
  fakeKv(new Map(), true);
  await assert.rejects(() => writeUser("u1", { watchlist: [], snapshots: [] }));
});

test("falls back to a file when KV is not configured", async () => {
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  const dir = await mkdtemp(path.join(tmpdir(), "vestail-store-"));
  process.env.VESTAIL_DATA_DIR = dir;
  try {
    await writeUser("u1", { watchlist: [], snapshots: [{ day: "2026-10-12", usd: 5 }] });
    assert.deepEqual((await readUser("u1")).snapshots, [{ day: "2026-10-12", usd: 5 }]);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test("keeps one snapshot a day and at most a year", () => {
  const start = { watchlist: [], snapshots: [] };
  const once = withSnapshot(start, 100, new Date("2026-10-12T09:00:00Z"));
  const twice = withSnapshot(once, 140, new Date("2026-10-12T18:00:00Z"));
  assert.deepEqual(twice.snapshots, [{ day: "2026-10-12", usd: 140 }]);

  const many = Array.from({ length: 400 }, (_, i) => ({ day: `2${String(i).padStart(6, "0")}`, usd: i }));
  assert.equal(withSnapshot({ watchlist: [], snapshots: many }, 1).snapshots.length, 366);
});
