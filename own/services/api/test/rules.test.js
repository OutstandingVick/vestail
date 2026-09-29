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

test("unknown country is 404 unknown_country", async () => {
  const { res, body } = await json("/rules/XX");
  assert.equal(res.status, 404);
  assert.equal(body.error.code, "unknown_country");
});
