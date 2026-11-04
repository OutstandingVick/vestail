"use client";

import { Users } from "@phosphor-icons/react";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { useAdminOverview } from "@/components/admin/AdminContext";

const shortId = (id: string) => id.length > 22 ? `${id.slice(0, 12)}…${id.slice(-6)}` : id;

export default function AdminUsersPage() {
  const { recentUsers, users } = useAdminOverview();
  return (
    <div className="space-y-7">
      <AdminHeader title="Users" description="Recent customer accounts, self-declared buyer profiles, and linked wallet adoption. No identity verification is implied." />
      <section className="grid gap-4 sm:grid-cols-3" aria-label="User totals">
        <Stat label="All users" value={users.total} />
        <Stat label="Profiled" value={users.profiled} />
        <Stat label="Linked wallets" value={users.wallets} />
      </section>
      {recentUsers.length ? (
        <section className="overflow-hidden rounded-card bg-surface shadow-[0_8px_28px_rgb(34_25_78/0.05)] ring-1 ring-line">
          <div className="flex items-center gap-3 px-5 py-5 sm:px-6"><span className="grid size-9 place-items-center rounded-full bg-action-wash text-action-ink"><Users size={18} weight="bold" aria-hidden="true" /></span><div><h2 className="font-bold">Newest accounts</h2><p className="text-xs text-muted">Most recently created Vestail users</p></div></div>
          <div className="overflow-x-auto border-t border-line"><table className="w-full min-w-[720px] text-left text-sm"><caption className="sr-only">Most recently created Vestail users</caption><thead className="bg-wash text-xs uppercase tracking-wide text-muted"><tr><th className="px-5 py-3.5">User</th><th className="px-5 py-3.5">Joined</th><th className="px-5 py-3.5">Country</th><th className="px-5 py-3.5">Buyer type</th><th className="px-5 py-3.5 text-right">Wallets</th></tr></thead><tbody className="divide-y divide-line">{recentUsers.map(user => <tr key={user.id} className="hover:bg-wash/70"><td className="px-5 py-4 font-mono text-xs" title={user.id}>{shortId(user.id)}</td><td className="whitespace-nowrap px-5 py-4">{new Date(user.joinedAt).toLocaleDateString()}</td><td className="px-5 py-4">{user.country ?? <span className="text-muted">Not declared</span>}</td><td className="px-5 py-4 capitalize">{user.who ?? <span className="text-muted">Not declared</span>}</td><td className="px-5 py-4 text-right font-semibold tabular-nums">{user.walletCount}</td></tr>)}</tbody></table></div>
        </section>
      ) : <EmptyState title="No user data available" detail="Privy returned no customer accounts, or the account service is unavailable." />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <article className="rounded-card bg-surface p-5 shadow-[0_8px_28px_rgb(34_25_78/0.05)] ring-1 ring-line"><p className="text-sm text-muted">{label}</p><p className="mt-2 text-3xl font-bold tabular-nums">{value}</p></article>;
}
