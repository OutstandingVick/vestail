import assert from "node:assert/strict";
import { describe, it } from "node:test";

const { toBaseUnits, fromBaseUnits } = await import(
  new URL("../lib/amounts.ts", import.meta.url)
);

describe("toBaseUnits", () => {
  it("converts exactly", () => {
    assert.equal(toBaseUnits("12.5", 6), 12_500_000n);
    assert.equal(toBaseUnits("0.000001", 6), 1n);
    assert.equal(toBaseUnits("1", 6), 1_000_000n);
    assert.equal(toBaseUnits(".5", 6), 500_000n);
    assert.equal(toBaseUnits("5.", 6), 5_000_000n);
    assert.equal(toBaseUnits(" 7 ", 6), 7_000_000n);
  });

  it("does not drift the way floats do", () => {
    assert.equal(toBaseUnits("0.3", 6), 300_000n);
    assert.equal(toBaseUnits("1234567.891011", 6), 1_234_567_891_011n);
  });

  it("refuses to round away the user's digits", () => {
    assert.equal(toBaseUnits("0.0000001", 6), null);
  });

  it("rejects anything that is not a plain decimal", () => {
    for (const bad of ["", ".", "-1", "1e3", "1,000", "abc", "1.2.3", "0x10"]) {
      assert.equal(toBaseUnits(bad, 6), null, bad);
    }
  });
});

describe("fromBaseUnits", () => {
  it("converts exactly and drops trailing zeros", () => {
    assert.equal(fromBaseUnits(12_500_000n, 6), "12.5");
    assert.equal(fromBaseUnits("1", 6), "0.000001");
    assert.equal(fromBaseUnits(5_145_939n, 9), "0.005145939");
    assert.equal(fromBaseUnits(0n, 6), "0");
    assert.equal(fromBaseUnits(1_000_000n, 6), "1");
  });

  it("round-trips", () => {
    for (const s of ["0.1", "12.345678", "999999.999999", "1"]) {
      assert.equal(fromBaseUnits(toBaseUnits(s, 6), 6), s);
    }
  });
});
