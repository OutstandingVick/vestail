import assert from "node:assert/strict";
import test from "node:test";

import { testerApplicationSchema } from "./tester-application-schema.ts";

const valid = {
  xHandle: " @tester ", email: "TESTER@EXAMPLE.COM", country: "Nigeria", relationship: "Citizen",
  wallet: "11111111111111111111111111111111", experience: "Some", reason: "I test carefully.",
  telegram: "vestail_tester", website: "",
};

test("normalizes a valid tester application", () => {
  const row = testerApplicationSchema.parse(valid);
  assert.equal(row.xHandle, "@tester");
  assert.equal(row.email, "tester@example.com");
});

test("requires every selection and contact field", () => {
  const result = testerApplicationSchema.safeParse({ ...valid, xHandle: "", email: "bad", country: "", relationship: "", experience: "", telegram: "" });
  assert.equal(result.success, false);
  if (!result.success) assert.deepEqual(Object.keys(result.error.flatten().fieldErrors).sort(), ["country", "email", "experience", "relationship", "telegram", "xHandle"]);
});
