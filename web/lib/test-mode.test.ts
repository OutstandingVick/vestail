import assert from "node:assert/strict";
import test from "node:test";

import { choosePurchasePath, simulationAllowed } from "./test-mode.ts";

test("test mode never calls the live swap", async () => {
  let swapCalls = 0;
  const result = await choosePurchasePath({
    testMode: true,
    simulate: () => "simulated",
    live: () => { swapCalls += 1; return "live"; },
  });
  assert.equal(result, "simulated");
  assert.equal(swapCalls, 0);
});

test("restricted assets stay blocked in test mode", () => {
  assert.deepEqual(simulationAllowed("cannot_own", true), {
    ok: false,
    error: "This asset cannot be purchased in your declared country.",
  });
});

test("conditional assets require acknowledgement in test mode", () => {
  assert.equal(simulationAllowed("conditional", false).ok, false);
  assert.equal(simulationAllowed("conditional", true).ok, true);
});
