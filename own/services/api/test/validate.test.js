import { test } from "node:test";
import assert from "node:assert/strict";
import { loadSpec } from "../src/spec.js";
import { createValidator } from "../src/validate.js";

const v = createValidator(loadSpec());

test("applies spec defaults", () => {
  assert.deepEqual(v.params("/matrix", "get")({ query: {} }), { who: "citizen" });
});

test("rejects a bad buyer type with bad_buyer_type", () => {
  assert.throws(() => v.params("/matrix", "get")({ query: { who: "tourist" } }), { code: "bad_buyer_type" });
});

test("rejects values outside an enum or pattern with validation", () => {
  assert.throws(() => v.params("/matrix", "get")({ query: { sort: "size" } }), { code: "validation" });
  assert.throws(() => v.params("/rules/{country}", "get")({ path: { country: "ng" } }), { code: "validation" });
});

test("validates request bodies against the spec", () => {
  const click = v.body("/orders/click", "post");
  const ok = { country: "NG", asset: "cryptocurrency", who: "citizen", venue: "Luno" };
  assert.deepEqual(click(ok), ok);
  assert.throws(() => click(undefined), { code: "validation" });
  assert.throws(() => click({ ...ok, venue: undefined }), { code: "validation" });
  assert.throws(() => click({ ...ok, who: "tourist" }), { code: "bad_buyer_type" });
});

test("requires required parameters", () => {
  assert.throws(() => v.params("/resolve", "get")({ query: {} }), { code: "validation" });
});
