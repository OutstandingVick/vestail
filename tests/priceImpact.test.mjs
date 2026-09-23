import assert from "node:assert/strict";
import { describe, it } from "node:test";

const { impactWarning } = await import(
  new URL("../lib/app/priceImpact.ts", import.meta.url)
);

/** 50 USDC, six decimals. */
const FIFTY = BigInt(50_000_000);

describe("price impact warning", () => {
  it("says nothing when the route prices close to the market", () => {
    assert.equal(impactWarning(0.12, FIFTY), null);
    assert.equal(impactWarning(-1.4, FIFTY), null);
  });

  it("warns above the threshold", () => {
    const warning = impactWarning(2.8, FIFTY);
    assert.equal(warning?.percent, "2.8");
    // 2.8% of 50 USDC, in base units.
    assert.equal(warning?.costUnits, BigInt(1_400_000));
  });

  it("reads the magnitude, not the sign", () => {
    assert.deepEqual(impactWarning(-2.8, FIFTY), impactWarning(2.8, FIFTY));
  });

  it("scales the cost to whatever is being paid", () => {
    // 2 SOL at nine decimals, 5% away from the market: 0.1 SOL.
    assert.equal(impactWarning(5, BigInt(2_000_000_000))?.costUnits, BigInt(100_000_000));
  });

  it("says nothing without a quote or an amount", () => {
    assert.equal(impactWarning(null, FIFTY), null);
    assert.equal(impactWarning(3, null), null);
    assert.equal(impactWarning(3, BigInt(0)), null);
  });
});
