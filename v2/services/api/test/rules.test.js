import { test } from "node:test";
import assert from "node:assert/strict";
import { json } from "./helpers.js";

test("GET /rules/{country} keys every asset by id", async () => {
  const { res, body } = await json("/rules/NG?who=foreigner");
  assert.equal(res.status, 200);
  assert.equal(body.country, "NG");
  assert.equal(body.who, "foreigner");
  assert.equal(Object.keys(body.rules).length, 20);
  assert.ok(Object.values(body.rules).every(s => ["can_own", "conditional", "cannot_own"].includes(s)));
});

test("GET /rules/{country}/{asset} returns the status and tagged venues", async () => {
  const { res, body } = await json("/rules/NG/cryptocurrency");
  assert.equal(res.status, 200);
  assert.equal(body.who, "citizen");
  assert.ok(["can_own", "conditional"].includes(body.status));
  assert.ok(body.venues.length > 0);
  assert.ok(body.venues.filter(x => x.url).every(x => x.url.includes("ref=vestail")));
});

test("a cannot_own rule lists no venues", async () => {
  const { body: all } = await json("/rules/NG?who=foreigner");
  const blocked = Object.keys(all.rules).find(id => all.rules[id] === "cannot_own");
  assert.ok(blocked, "fixture needs a cannot_own cell");
  const { body } = await json(`/rules/NG/${blocked}?who=foreigner`);
  assert.equal(body.status, "cannot_own");
  assert.deepEqual(body.venues, []);
});

test("unknown asset is 404 unknown_asset", async () => {
  const { res, body } = await json("/rules/NG/moon_rocks");
  assert.equal(res.status, 404);
  assert.equal(body.error.code, "unknown_asset");
});

test("unknown country is 404 unknown_country", async () => {
  const { res, body } = await json("/rules/XX");
  assert.equal(res.status, 404);
  assert.equal(body.error.code, "unknown_country");
});
