import assert from "node:assert/strict";
import { test } from "node:test";
import { encodeFunctionData, parseAbi } from "viem";

import fixture from "./fixtures.kyber-base.json" with { type: "json" };
import { inspectEvmBuy, KYBER_ROUTER } from "./inspectEvm.ts";

// A real KyberSwap build on Base (0.01 ETH -> NVDAc), built for this taker.
const taker = "0x1111111111111111111111111111111111111111";
const NVDAC = "0xb20000000000000000000078ee7ce2fE4908108C";
const real = { to: fixture.to, data: fixture.data, value: fixture.value };
const expect = { taker, amountWei: fixture.value, tokenOut: NVDAC };

const abi = parseAbi([
  "struct SwapDescriptionV2 { address srcToken; address dstToken; address[] srcReceivers; uint256[] srcAmounts; address[] feeReceivers; uint256[] feeAmounts; address dstReceiver; uint256 amount; uint256 minReturnAmount; uint256 flags; bytes permit; }",
  "function swapSimpleMode(address caller, SwapDescriptionV2 desc, bytes executorData, bytes clientData) returns (uint256, uint256)",
]);
const attacker = "0x" + "66".repeat(20);
const simple = (over: Record<string, unknown>) => ({
  ...real,
  data: encodeFunctionData({ abi, functionName: "swapSimpleMode", args: [taker, {
    srcToken: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE", dstToken: NVDAC, srcReceivers: [], srcAmounts: [], feeReceivers: [], feeAmounts: [],
    dstReceiver: taker, amount: BigInt(fixture.value), minReturnAmount: BigInt(1), flags: BigInt(0), permit: "0x", ...over,
  } as never, "0x", "0x"] }),
});

test("a real KyberSwap build for the buyer passes", () => assert.deepEqual(inspectEvmBuy(real, expect), { ok: true }));
test("another contract is refused", () => assert.equal(inspectEvmBuy({ ...real, to: "0x" + "22".repeat(20) }, expect).ok, false));
test("a different ETH amount is refused", () => assert.equal(inspectEvmBuy({ ...real, value: "1" }, expect).ok, false));
test("non-router calldata (an approval) is refused", () => assert.equal(inspectEvmBuy({ ...real, data: "0x095ea7b3" + "00".repeat(64) }, expect).ok, false));
test("a build for someone else is refused", () => assert.equal(inspectEvmBuy(real, { ...expect, taker: attacker }).ok, false));
test("output sent elsewhere while the buyer is named as caller is refused", () => {
  // The old check only looked for the buyer's address anywhere in the calldata: here it is, as caller.
  assert.equal(inspectEvmBuy(simple({ dstReceiver: attacker }), expect).ok, false);
});
test("buying a different token is refused", () => assert.equal(inspectEvmBuy(simple({ dstToken: attacker }), expect).ok, false));
test("spending a token instead of ETH is refused", () => assert.equal(inspectEvmBuy(simple({ srcToken: attacker }), expect).ok, false));
test("an unknown fee receiver is refused", () => assert.equal(inspectEvmBuy(simple({ feeReceivers: [attacker], feeAmounts: [BigInt(1)] }), expect).ok, false));
test("the honest swapSimpleMode shape passes", () => assert.deepEqual(inspectEvmBuy(simple({}), expect), { ok: true }));
test("router is KyberSwap's", () => assert.equal(KYBER_ROUTER.toLowerCase(), real.to.toLowerCase()));
