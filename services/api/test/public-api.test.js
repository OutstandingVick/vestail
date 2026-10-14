import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";
import { loadData } from "../src/data.js";
import { MemoryKeyStore } from "../src/public/key-store.js";

const source = { title: "Test statute", url: "https://example.test/statute" };

async function fixture({ rateLimit = 60 } = {}) {
  const data = loadData();
  const setSource = (country, who, assetId) => {
    const assetName = data.nameById[assetId];
    const index = data.core.ASSETS.indexOf(assetName);
    data.raw.countries.countries.find(item => item.code === country).rules[who][assetId].sources = [source];
    data.raw.countries.countries.find(item => item.code === country).rules[who][assetId].verified_at = "2026-10-01";
    data.core.COUNTRIES.find(item => item.code === country).provenance[who][index] = { sources: [source], verified_at: "2026-10-01" };
  };
  setSource("NG", "citizen", "residential_property"); // can_own
  setSource("NG", "citizen", "foreign_equities"); // conditional
  setSource("NG", "foreigner", "agricultural_land"); // cannot_own
  const store = new MemoryKeyStore();
  const issued = await store.issue({ label: "test", rateLimit });
  const app = createApp({ data, partnerKeyStore: store, partnerAccessNow: () => 0 });
  const request = (path, init = {}) => app.request(`/api/v1${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${issued.key}`, ...(init.headers || {}) },
  });
  return { app, data, store, issued, request };
}

const check = (country, residency, asset) => ({
  country, residency, asset: { class: asset, id: asset },
});

test("check exposes all three sourced verdicts and unverified separately", async () => {
  const { request } = await fixture();
  const cases = [
    [check("NG", "citizen", "residential_property"), "eligible"],
    [check("NG", "citizen", "foreign_equities"), "conditional"],
    [check("NG", "foreigner", "agricultural_land"), "restricted"],
    [check("NG", "citizen", "gold_bullion"), "unverified"],
    [check("NG", "resident", "gold_bullion"), "unverified"],
  ];
  for (const [input, verdict] of cases) {
    const response = await request("/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.verdict, verdict);
    assert.ok(body.reasons.length > 0);
    assert.match(body.disclaimer, /informational/i);
    if (verdict !== "unverified") assert.deepEqual(body.sources, [{ label: source.title, url: source.url }]);
  }
});

test("missing and revoked keys fail without storing a request body", async () => {
  const { app, store, issued, request } = await fixture();
  assert.equal((await app.request("/api/v1/countries")).status, 401);
  await store.revoke(issued.id);
  assert.equal((await request("/countries")).status, 401);
  const state = await store.load();
  assert.equal(JSON.stringify(state).includes("country"), false);
});

test("rate limiting is per key and records daily counts only", async () => {
  const { request, store, issued } = await fixture({ rateLimit: 2 });
  assert.equal((await request("/countries")).status, 200);
  assert.equal((await request("/countries")).status, 200);
  const blocked = await request("/countries");
  assert.equal(blocked.status, 429);
  assert.equal(blocked.headers.get("Retry-After"), "60");
  assert.deepEqual(await store.usage(issued.id), [{ date: "1970-01-01", count: 2 }]);
});

test("batch accepts 100 checks and rejects 101 with a field path", async () => {
  const { request } = await fixture();
  const item = check("NG", "citizen", "residential_property");
  const ok = await request("/check/batch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ checks: Array(100).fill(item) }) });
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).results.length, 100);
  const bad = await request("/check/batch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ checks: Array(101).fill(item) }) });
  assert.equal(bad.status, 400);
  assert.match((await bad.json()).error.message, /checks/);
});

test("invalid requests use the standard error shape and name the field", async () => {
  const { request } = await fixture();
  const response = await request("/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(check("Nigeria", "citizen", "gold_bullion")) });
  assert.equal(response.status, 400);
  assert.deepEqual(Object.keys(await response.clone().json()), ["error"]);
  assert.match((await response.json()).error.message, /country/);
});

test("assets includes each token issuer version and read endpoints support ETags", async () => {
  const { request } = await fixture();
  const response = await request("/assets?country=NG&residency=citizen");
  assert.equal(response.status, 200);
  const body = await response.json();
  const versions = body.assets.filter(item => item.asset.type === "tokenized_asset");
  assert.ok(versions.length > 1);
  assert.ok(versions.every(item => item.asset.issuer && item.asset.id));
  const tag = response.headers.get("ETag");
  assert.ok(tag);
  const cached = await request("/assets?country=NG&residency=citizen", { headers: { "If-None-Match": tag } });
  assert.equal(cached.status, 304);
});

test("countries reports sourced and unverified coverage and rules expose history", async () => {
  const { request } = await fixture();
  const countries = await (await request("/countries")).json();
  const nigeria = countries.countries.find(item => item.code === "NG");
  assert.equal(nigeria.sourced, 3);
  assert.equal(nigeria.total, 40);
  const detail = await (await request("/rules/class%3ANG%3Acitizen%3Aresidential_property")).json();
  assert.equal(detail.verdict, "eligible");
  assert.equal(detail.history.length, 1);
});

test("OpenAPI is public, generated from the schemas, and CORS covers partner routes", async () => {
  const { app } = await fixture();
  const response = await app.request("/api/v1/openapi.json", { headers: { Origin: "https://partner.example" } });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "*");
  const spec = await response.json();
  assert.equal(spec.openapi, "3.1.0");
  assert.ok(spec.paths["/check/batch"]);
  assert.ok(spec.components.schemas.CheckInput);
});
