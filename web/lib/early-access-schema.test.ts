import assert from "node:assert/strict";
import test from "node:test";

import { earlyAccessSchema } from "./early-access-schema.ts";

const valid = { firstName: " Ada ", email: "ADA@EXAMPLE.COM", country: "Nigeria", citizenship: "Citizen", interests: ["Stocks"], website: "" };

test("normalizes a valid early access submission", () => {
  const row = earlyAccessSchema.parse(valid);
  assert.equal(row.firstName, "Ada");
  assert.equal(row.email, "ada@example.com");
});

test("requires a valid email, country and ownership interest", () => {
  const result = earlyAccessSchema.safeParse({ ...valid, email: "no", country: "", interests: [] });
  assert.equal(result.success, false);
  if (!result.success) assert.deepEqual(Object.keys(result.error.flatten().fieldErrors).sort(), ["country", "email", "interests"]);
});
