import assert from "node:assert/strict";
import test from "node:test";

import { summarizeAdminUsers } from "./admin-metrics.ts";
import type { AdminUserRow } from "./admin-types.ts";

const now = Date.parse("2026-10-12T12:00:00.000Z");
const users: AdminUserRow[] = [
  { id: "new", joinedAt: "2026-10-10T12:00:00.000Z", country: "NG", who: "citizen", walletCount: 2, hasProfile: true },
  { id: "old", joinedAt: "2026-09-01T12:00:00.000Z", country: null, who: null, walletCount: 0, hasProfile: false },
];

test("owner user metrics are derived from account rows", () => {
  assert.deepEqual(summarizeAdminUsers(users, now), { total: 2, profiled: 1, wallets: 2, recent7d: 1 });
});

test("an empty account list stays honestly zero", () => {
  assert.deepEqual(summarizeAdminUsers([], now), { total: 0, profiled: 0, wallets: 0, recent7d: 0 });
});
