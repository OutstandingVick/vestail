import { test } from "node:test";
import assert from "node:assert/strict";
import { json } from "./helpers.js";

test("GET /tokens lists the tokenised symbols", async () => {
  const { res, body } = await json("/tokens");
  assert.equal(res.status, 200);
  const nvda = body.find(s => s.symbol === "NVDA");
  assert.equal(nvda.entity, "Nvidia");
  assert.deepEqual(nvda.providers.sort(), ["ondo", "xstocks"]);
});

test("GET /tokens/{symbol} judges each token, stricter of issuer and class", async () => {
  const { res, body } = await json("/tokens/NVDA?country=NG&who=foreigner");
  assert.equal(res.status, 200);
  assert.equal(body.asset, "foreign_equities");
  assert.equal(body.class_status, "can_own");
  for (const t of body.tokens) {
    assert.equal(t.status, "conditional");
    assert.equal(t.decided_by, "issuer");
    assert.ok(t.issuer.evidence.every(e => e.source_url));
  }
});

test("a token with no issuer rule for the country is not assessed, never eligible", async () => {
  const { body } = await json("/tokens/NVDA?country=GB");
  assert.ok(body.tokens.every(t => t.assessed === false && t.status === null));
});

test("the class's own provenance is passed through untouched", async () => {
  const { body } = await json("/tokens/NVDA?country=NG");
  assert.deepEqual(body.class_sources, []);
  assert.equal(body.class_verified_at, null);
});

test("errors: unknown symbol, unknown country, missing country", async () => {
  assert.equal((await json("/tokens/NOPE?country=NG")).body.error.code, "unknown_symbol");
  assert.equal((await json("/tokens/NVDA?country=XX")).body.error.code, "unknown_country");
  assert.equal((await json("/tokens/NVDA")).res.status, 400);
});
