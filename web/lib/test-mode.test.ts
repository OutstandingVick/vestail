import assert from "node:assert/strict";
import test from "node:test";

import { addSimulatedHolding, choosePurchasePath, readSimulatedHoldings, resetSimulatedHoldings, simulationAllowed } from "./test-mode.ts";

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

test("simulated holdings stay in local storage and can be reset", () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  };
  addSimulatedHolding(storage, {
    id: "one", asset: "foreign_equities", symbol: "NVDA", tokenSymbol: "NVDAx", issuer: "xstocks",
    amountUsd: 100, quantity: 0.5, priceUsd: 200, verdict: "conditional", createdAt: "2026-10-20T10:00:00.000Z",
  });
  assert.equal(readSimulatedHoldings(storage).length, 1);
  resetSimulatedHoldings(storage);
  assert.deepEqual(readSimulatedHoldings(storage), []);
});

test("denied storage never breaks test mode", () => {
  const denied = { getItem: () => { throw new Error("denied"); }, setItem: () => { throw new Error("denied"); }, removeItem: () => { throw new Error("denied"); } };
  assert.deepEqual(readSimulatedHoldings(denied), []);
  assert.doesNotThrow(() => resetSimulatedHoldings(denied));
});
