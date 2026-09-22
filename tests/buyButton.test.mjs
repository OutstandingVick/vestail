import assert from "node:assert/strict";
import { describe, it } from "node:test";

const { buyButtonState } = await import(new URL("../lib/app/buyButton.ts", import.meta.url));

/** A fully ready eligible purchase; each test breaks one thing. */
const ready = {
  walletConnected: true,
  countryChosen: true,
  stockChosen: true,
  selectedStatus: "eligible",
  selectedTokenSymbol: "NVDAx",
  amount: BigInt(5_000_000),
  minAmount: BigInt(1_000_000),
  minAmountLabel: "1 USDC",
  balance: BigInt(10_000_000),
  payTokenSymbol: "USDC",
  estimate: "ready",
  acknowledged: false,
  busy: null,
};
const state = (patch) => buyButtonState({ ...ready, ...patch });

describe("buy button", () => {
  it("is ready to buy the selected version when everything is set", () => {
    assert.deepEqual(state({}), { kind: "ready", label: "Buy NVDAx", enabled: true });
  });

  it("asks for each missing step with the spec's wording", () => {
    assert.equal(state({ walletConnected: false }).label, "Connect wallet");
    assert.equal(state({ countryChosen: false }).label, "Choose a country and stock");
    assert.equal(state({ stockChosen: false }).label, "Choose a country and stock");
    assert.equal(state({ amount: null }).label, "Enter an amount");
    assert.equal(state({ amount: BigInt(0) }).label, "Enter an amount");
  });

  it("asks for the earliest missing step first", () => {
    const s = state({ walletConnected: false, countryChosen: false, amount: null });
    assert.equal(s.kind, "connect");
  });

  it("only connect and ready can be pressed", () => {
    assert.equal(state({ walletConnected: false }).enabled, true);
    for (const patch of [
      { countryChosen: false },
      { selectedStatus: null },
      { amount: null },
      { amount: BigInt(1) },
      { balance: BigInt(1_000_000) },
      { estimate: "no_route" },
      { selectedStatus: "conditional" },
      { busy: "signing" },
      { busy: "executing" },
    ]) {
      assert.equal(state(patch).enabled, false, JSON.stringify(patch, (_, v) => (typeof v === "bigint" ? `${v}` : v)));
    }
  });

  it("holds a conditional version until its conditions are acknowledged", () => {
    assert.equal(state({ selectedStatus: "conditional" }).label, "Review the conditions below");
    assert.deepEqual(state({ selectedStatus: "conditional", acknowledged: true }), {
      kind: "ready",
      label: "Buy NVDAx",
      enabled: true,
    });
  });

  it("never offers to buy a restricted or unassessed version", () => {
    for (const selectedStatus of ["restricted", "not_assessed"]) {
      for (const acknowledged of [false, true]) {
        const s = state({ selectedStatus, acknowledged });
        assert.equal(s.kind, "pick_version");
        assert.equal(s.enabled, false);
      }
    }
  });

  it("names the minimum, the missing balance and a missing route", () => {
    assert.equal(state({ amount: BigInt(999_999) }).label, "Minimum is 1 USDC");
    assert.equal(state({ balance: BigInt(4_999_999) }).label, "Not enough USDC");
    assert.equal(state({ estimate: "no_route" }).label, "No route found");
  });

  it("does not block on an unknown balance; the order route checks funds", () => {
    assert.equal(state({ balance: null }).kind, "ready");
  });

  it("shows progress while signing and executing", () => {
    assert.equal(state({ busy: "signing" }).label, "Confirm in your wallet…");
    assert.equal(state({ busy: "executing" }).label, "Buying…");
  });
});
