import type { AdminUserRow } from "@/lib/admin-types";

export function summarizeAdminUsers(users: AdminUserRow[], now = Date.now()) {
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  return {
    total: users.length,
    profiled: users.filter(user => user.hasProfile).length,
    wallets: users.reduce((sum, user) => sum + user.walletCount, 0),
    recent7d: users.filter(user => Date.parse(user.joinedAt) >= weekAgo).length,
  };
}
