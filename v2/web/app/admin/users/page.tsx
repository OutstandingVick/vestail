"use client";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { useAdminOverview } from "@/components/admin/AdminContext";

const shortId = (id: string) => id.length > 22 ? `${id.slice(0, 12)}…${id.slice(-6)}` : id;

export default function AdminUsersPage() {
  const { recentUsers } = useAdminOverview();
  return <div className="space-y-7"><AdminHeader title="Users" description="Recent customer accounts, self-declared buyer profiles, and linked wallet adoption. No identity verification is implied." />{recentUsers.length ? <div className="overflow-x-auto rounded-card border border-line bg-surface"><table className="w-full min-w-[720px] text-left text-sm"><caption className="sr-only">Most recently created Vestail users</caption><thead className="bg-wash text-xs uppercase tracking-wide text-muted"><tr><th className="px-5 py-3.5">User</th><th className="px-5 py-3.5">Joined</th><th className="px-5 py-3.5">Country</th><th className="px-5 py-3.5">Buyer type</th><th className="px-5 py-3.5 text-right">Wallets</th></tr></thead><tbody className="divide-y divide-line">{recentUsers.map(user => <tr key={user.id}><td className="px-5 py-4 font-mono text-xs" title={user.id}>{shortId(user.id)}</td><td className="px-5 py-4 whitespace-nowrap">{new Date(user.joinedAt).toLocaleDateString()}</td><td className="px-5 py-4">{user.country ?? <span className="text-muted">Not declared</span>}</td><td className="px-5 py-4 capitalize">{user.who ?? <span className="text-muted">Not declared</span>}</td><td className="px-5 py-4 text-right tabular-nums">{user.walletCount}</td></tr>)}</tbody></table></div> : <EmptyState title="No user data available" detail="Privy returned no customer accounts, or the account service is unavailable." />}</div>;
}
