import "server-only";

import type { AdminUserRow } from "@/lib/admin-types";
import { listPrivyUsers } from "@/lib/server/privy";
import type { BuyerType } from "@/lib/types";

const buyer = (value: unknown): BuyerType | null => value === "citizen" || value === "foreigner" ? value : null;

export async function adminUsers(limit = 500): Promise<AdminUserRow[]> {
  const users = await listPrivyUsers(limit);
  return users.map(user => {
    const meta = (user.custom_metadata ?? {}) as Record<string, unknown>;
    const country = typeof meta.country === "string" ? meta.country : null;
    const who = buyer(meta.who);
    const walletCount = user.linked_accounts.filter(account => account.type === "wallet").length;
    return {
      id: user.id,
      joinedAt: new Date(user.created_at * 1000).toISOString(),
      country,
      who,
      walletCount,
      hasProfile: !!country && !!who,
    };
  }).sort((a, b) => b.joinedAt.localeCompare(a.joinedAt));
}
