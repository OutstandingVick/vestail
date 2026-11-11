import assert from "node:assert/strict";
import { test } from "node:test";

import { blockedReason, canAct } from "./utilities.ts";

const opt = (verdict: string, actionsEnabled: boolean, acknowledgementRequired: boolean) => ({ verdict, actionsEnabled, acknowledgementRequired }) as never;

test("lend, borrow and earn can't start before the risk is acknowledged", () => {
  const earn = opt("eligible", true, true);
  assert.equal(canAct(earn, false), false);
  assert.equal(blockedReason(earn, false), "Tick the acknowledgement first.");
  assert.equal(canAct(earn, true), true);
});
test("unverified and restricted options never act, acknowledged or not", () => {
  assert.equal(canAct(opt("unverified", false, false), true), false);
  assert.equal(canAct(opt("restricted", false, false), true), false);
  assert.match(blockedReason(opt("unverified", false, false), true)!, /Not verified/);
});
test("an eligible spot trade needs no acknowledgement", () => assert.equal(canAct(opt("eligible", true, false), false), true));
