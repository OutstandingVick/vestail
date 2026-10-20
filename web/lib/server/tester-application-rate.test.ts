import assert from "node:assert/strict";
import test from "node:test";

import { resetTesterApplicationRates, testerApplicationRateAllowed } from "./tester-application-rate.ts";

test("rate limits tester applications without retaining IPs elsewhere", () => {
  resetTesterApplicationRates();
  for (let index = 0; index < 6; index += 1) assert.equal(testerApplicationRateAllowed("test-ip", 1_000 + index), true);
  assert.equal(testerApplicationRateAllowed("test-ip", 2_000), false);
  assert.equal(testerApplicationRateAllowed("test-ip", 10 * 60 * 1_000 + 2_000), true);
});
