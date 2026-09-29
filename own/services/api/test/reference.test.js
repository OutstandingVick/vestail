import { test } from "node:test";
import assert from "node:assert/strict";
import { json } from "./helpers.js";

test("GET /assets lists the 20 asset classes in index order", async () => {
  const { res, body } = await json("/assets");
  assert.equal(res.status, 200);
  assert.equal(body.length, 20);
  assert.deepEqual(body.map(a => a.index), [...Array(20).keys()]);
  assert.deepEqual(Object.keys(body[0]), ["id", "index", "name"]);
});

test("GET /categories returns asset ids, not names", async () => {
  const { body } = await json("/categories");
  const equities = body.find(c => c.id === "equities");
  assert.ok(equities.assets.includes("foreign_equities"));
});

test("GET /countries lists code, name and flag", async () => {
  const { body } = await json("/countries");
  assert.deepEqual(Object.keys(body[0]), ["code", "name", "flag"]);
  assert.ok(body.some(c => c.code === "NG"));
});
