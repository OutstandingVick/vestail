import assert from "node:assert/strict";
import { test } from "node:test";

import { inspectEvmBuy, KYBER_ROUTER } from "./inspectEvm.ts";

const taker = "0x1111111111111111111111111111111111111111";
const good = { to: KYBER_ROUTER, data: "0xe21fd0e9" + "00".repeat(40) + taker.slice(2) + "00".repeat(8), value: "10000000000000000" };
const expect = { taker, amountWei: "10000000000000000" };

test("a router swap of the chosen amount to the buyer passes", () => assert.deepEqual(inspectEvmBuy(good, expect), { ok: true }));
test("another contract is refused", () => assert.equal(inspectEvmBuy({ ...good, to: "0x" + "22".repeat(20) }, expect).ok, false));
test("a different ETH amount is refused", () => assert.equal(inspectEvmBuy({ ...good, value: "20000000000000000" }, expect).ok, false));
test("a non-swap call (e.g. an approval) is refused", () => assert.equal(inspectEvmBuy({ ...good, data: "0x095ea7b3" + good.data.slice(10) }, expect).ok, false));
test("output sent elsewhere is refused", () => assert.equal(inspectEvmBuy(good, { ...expect, taker: "0x" + "33".repeat(20) }).ok, false));
