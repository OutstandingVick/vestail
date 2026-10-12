import assert from "node:assert/strict";
import test from "node:test";

import { adminUserIds, isAdminUser } from "./admin-access.ts";

test("admin allowlist trims values and ignores blanks", () => {
  assert.deepEqual([...adminUserIds(" owner-a, ,owner-b ")], ["owner-a", "owner-b"]);
});

test("admin access is denied by default and exact when configured", () => {
  assert.equal(isAdminUser("owner-a", ""), false);
  assert.equal(isAdminUser(null, "owner-a"), false);
  assert.equal(isAdminUser("owner", "owner-a"), false);
  assert.equal(isAdminUser("owner-a", "owner-a,owner-b"), true);
});
