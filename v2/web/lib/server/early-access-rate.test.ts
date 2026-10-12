import assert from "node:assert/strict";
import test from "node:test";

import { earlyAccessRateAllowed, resetEarlyAccessRates } from "./early-access-rate.ts";

test("limits repeated signup attempts without retaining the IP elsewhere", () => {
  resetEarlyAccessRates();
  for (let index = 0; index < 8; index += 1) assert.equal(earlyAccessRateAllowed("test-ip", 1_000 + index), true);
  assert.equal(earlyAccessRateAllowed("test-ip", 2_000), false);
  assert.equal(earlyAccessRateAllowed("test-ip", 10 * 60 * 1_000 + 2_000), true);
});
