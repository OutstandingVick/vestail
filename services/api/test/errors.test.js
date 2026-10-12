import { test } from "node:test";
import assert from "node:assert/strict";
import { json } from "./helpers.js";

test("unknown routes return the standard error shape", async () => {
  const { res, body } = await json("/nope");
  assert.equal(res.status, 404);
  assert.equal(body.error.code, "not_found");
  assert.equal(typeof body.error.message, "string");
});
