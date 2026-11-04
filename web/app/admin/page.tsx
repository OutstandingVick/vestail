"use client";

import { ArrowRight, ChartBar, GlobeHemisphereWest, Path, ShieldCheck, UserPlus, Users, Wallet } from "@phosphor-icons/react";
import Link from "next/link";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { CoverageBar } from "@/components/admin/CoverageBar";
import { EmptyState } from "@/components/admin/EmptyState";
import { MetricCard } from "@/components/admin/MetricCard";
import { StatusPill } from "@/components/admin/StatusPill";
import { useAdminOverview } from "@/components/admin/AdminContext";

export default function AdminOverviewPage() {
  const data = useAdminOverview();
  const coverage = data.coverage.slice(0, 4);
  const profileRate = data.users.total ? Math.round((data.users.profiled / data.users.total) * 100) : 0;
  const healthy = data.health.filter(item => item.status === "healthy").length;

  return (
    <div className="space-y-8">
      <AdminHeader title="Good to see you." description="A concise view of customer growth, product coverage, routing activity, and the systems behind Vestail." />

      <section aria-label="Key metrics" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard featured label="Total users" value={data.users.total} detail={`${profileRate}% completed a buyer profile`} icon={Users} />
        <MetricCard label="New users · 7 days" value={data.users.recent7d} detail="Based on Privy account creation" icon={UserPlus} />
        <MetricCard label="Linked wallets" value={data.users.wallets} detail="Wallet accounts attached to users" icon={Wallet} />
        <MetricCard label="Routes recorded" value={data.activity.stats.orders_routed} detail={`${data.activity.stats.active_buyers_7d} active buyers in 7 days`} icon={Path} />
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_1.15fr_.9fr]">
        <section className="rounded-card bg-surface p-5 shadow-[0_8px_28px_rgb(34_25_78/0.05)] ring-1 ring-line sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-sm font-semibold text-muted">Catalog reach</p><p className="mt-3 text-4xl font-bold tabular-nums">{data.catalog.countries}</p><p className="mt-1 text-sm text-muted">countries covered</p></div>
            <span className="grid size-10 place-items-center rounded-full bg-action-wash text-action-ink"><GlobeHemisphereWest size={20} weight="bold" aria-hidden="true" /></span>
          </div>
          <dl className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-field bg-wash p-3"><dt className="text-xs text-muted">Asset classes</dt><dd className="mt-1 text-xl font-bold tabular-nums">{data.catalog.assets}</dd></div>
            <div className="rounded-field bg-wash p-3"><dt className="text-xs text-muted">Token symbols</dt><dd className="mt-1 text-xl font-bold tabular-nums">{data.catalog.tokenSymbols}</dd></div>
          </dl>
        </section>

        <section className="rounded-card bg-surface p-5 shadow-[0_8px_28px_rgb(34_25_78/0.05)] ring-1 ring-line sm:p-6">
          <div className="flex items-center justify-between gap-4"><div><h2 className="text-lg font-bold">Coverage snapshot</h2><p className="mt-1 text-xs text-muted">Live country and buyer matrices</p></div><Link href="/admin/coverage" aria-label="View all coverage" className="grid size-10 place-items-center rounded-full bg-wash focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emphasis"><ArrowRight size={18} aria-hidden="true" /></Link></div>
          {coverage.length ? <div className="mt-5 space-y-4">{coverage.map(row => <div key={`${row.country}-${row.who}`}><div className="mb-2 flex justify-between gap-4 text-xs"><span className="font-semibold">{row.name} <span className="font-normal capitalize text-muted">· {row.who}</span></span><span className="tabular-nums text-muted">{Object.values(row.totals).reduce((a, b) => a + b, 0)}</span></div><CoverageBar totals={row.totals} /></div>)}</div> : <div className="mt-5"><EmptyState title="Coverage unavailable" detail="No matrix data was returned." /></div>}
        </section>

        <section className="rounded-card bg-surface p-5 shadow-[0_8px_28px_rgb(34_25_78/0.05)] ring-1 ring-line sm:p-6">
          <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-bold">System status</h2><p className="mt-1 text-xs text-muted">{healthy} of {data.health.length} checks healthy</p></div><span className="grid size-10 place-items-center rounded-full bg-[#e8f4e4] text-[#285b1e]"><ShieldCheck size={20} weight="fill" aria-hidden="true" /></span></div>
          <div className="mt-4 space-y-2">{data.health.slice(0, 4).map(item => <div key={item.name} className="flex items-center justify-between gap-3 rounded-field bg-wash px-3 py-2.5"><span className="min-w-0 truncate text-sm font-semibold">{item.name}</span><StatusPill status={item.status} /></div>)}</div>
          <Link href="/admin/health" className="mt-4 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-emphasis">View product health<ArrowRight size={16} aria-hidden="true" /></Link>
        </section>
      </div>

      <section className="overflow-hidden rounded-card bg-surface shadow-[0_8px_28px_rgb(34_25_78/0.05)] ring-1 ring-line">
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-6"><div><h2 className="text-lg font-bold">Recent operations</h2><p className="mt-1 text-xs text-muted">The latest customer and routing signals</p></div><Link href="/admin/activity" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-ink-strong px-4 text-sm font-semibold text-on-ink">View activity<ArrowRight size={16} aria-hidden="true" /></Link></div>
        <div className="grid border-t border-line lg:grid-cols-2">
          <div className="p-5 sm:p-6 lg:border-e lg:border-line"><div className="mb-4 flex items-center gap-2 text-sm font-semibold"><ChartBar size={18} className="text-emphasis" aria-hidden="true" />Latest routes</div>{data.activity.recent.length ? <ul className="space-y-3">{data.activity.recent.slice(0, 4).map((item, index) => <li key={`${item.asset}-${item.venue}-${index}`} className="flex items-center justify-between gap-4 rounded-field bg-wash px-4 py-3"><span className="min-w-0 truncate text-sm font-semibold">{item.flag} {item.asset}</span><span className="shrink-0 text-xs text-muted">{item.venue} · {item.ago}</span></li>)}</ul> : <p className="rounded-field bg-wash p-4 text-sm text-muted">No routes recorded yet.</p>}</div>
          <div className="border-t border-line p-5 sm:p-6 lg:border-t-0"><div className="mb-4 flex items-center gap-2 text-sm font-semibold"><Users size={18} className="text-action" aria-hidden="true" />Newest users</div>{data.recentUsers.length ? <ul className="space-y-3">{data.recentUsers.slice(0, 4).map(user => <li key={user.id} className="flex items-center justify-between gap-4 rounded-field bg-wash px-4 py-3"><span className="min-w-0 truncate text-sm font-semibold">{user.country ?? "Profile not set"}</span><span className="shrink-0 text-xs capitalize text-muted">{user.who ?? "Unprofiled"} · {user.walletCount} wallets</span></li>)}</ul> : <p className="rounded-field bg-wash p-4 text-sm text-muted">No user data available.</p>}</div>
        </div>
      </section>
    </div>
  );
}
