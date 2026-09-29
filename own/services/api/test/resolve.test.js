import { test } from "node:test";
import assert from "node:assert/strict";
import { json } from "./helpers.js";

test("tesla shares matches the spec example", async () => {
  const { res, body } = await json("/resolve?q=tesla%20shares");
  assert.equal(res.status, 200);
  assert.equal(body.stage, "entity");
  assert.deepEqual(body.assets, ["domestic_equities", "foreign_equities"]);
  assert.deepEqual(body.entity, { name: "Tesla", kind: "Listed company", home: "US", asset: "equity-by-home" });
  assert.deepEqual(body.perCountry, { rule: "equity-by-home", home: "US" });
  assert.deepEqual(body.trail, ["Tesla", "Listed company (US)", "Equities", "Domestic in US, foreign elsewhere"]);
  assert.match(body.note, /Tesla is a listed company from US/);
});

test("every stage carries a trail", async () => {
  for (const [q, stage] of [["a house", "alias"], ["regulated sectors", "category"], ["foreign eq", "asset"]]) {
    const { body } = await json(`/resolve?q=${encodeURIComponent(q)}`);
    assert.equal(body.stage, stage, q);
    assert.ok(body.trail.length > 0, q);
    assert.ok(body.assets.every(a => /^[a-z_]+$/.test(a)), q);
  }
});

test("no match returns stage none", async () => {
  const { body } = await json("/resolve?q=xyz");
  assert.deepEqual(body, { stage: "none", assets: [], trail: [], note: "" });
});

test("q is required", async () => {
  const { res, body } = await json("/resolve");
  assert.equal(res.status, 400);
  assert.equal(body.error.code, "validation");
});
