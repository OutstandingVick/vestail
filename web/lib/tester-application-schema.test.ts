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
