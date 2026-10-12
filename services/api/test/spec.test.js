import { test } from "node:test";
import assert from "node:assert/strict";
import { json } from "./helpers.js";

test("GET /openapi.json serves the contract", async () => {
  const { res, body } = await json("/openapi.json");
  assert.equal(res.status, 200);
  assert.equal(body.openapi, "3.1.0");
  assert.ok(body.paths["/matrix"]);
});
