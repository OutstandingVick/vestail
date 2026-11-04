"use client";

import { Pulse } from "@phosphor-icons/react";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { useAdminOverview } from "@/components/admin/AdminContext";

export default function AdminActivityPage() {
  const { activity } = useAdminOverview();
  return (
    <div className="space-y-7">
      <AdminHeader title="Routing activity" description="Recorded handoffs from Vestail to a venue. A route is intent, not proof that a trade completed." />
      <section className="grid gap-4 sm:grid-cols-2" aria-label="Routing totals">
        <Metric label="All recorded routes" value={activity.stats.orders_routed} />
        <Metric label="Active buyers" value={activity.stats.active_buyers_7d} detail="Last 7 days" />
      </section>
      {activity.recent.length ? (
        <section className="overflow-hidden rounded-card bg-surface shadow-[0_8px_28px_rgb(34_25_78/0.05)] ring-1 ring-line">
          <header className="flex items-center gap-3 p-5 sm:px-6"><span className="grid size-9 place-items-center rounded-full bg-action-wash text-action-ink"><Pulse size={18} weight="bold" aria-hidden="true" /></span><div><h2 className="font-bold">Latest handoffs</h2><p className="text-xs text-muted">Newest recorded route intent</p></div></header>
          <ul className="divide-y divide-line border-t border-line">{activity.recent.map((item, index) => <li className="grid gap-2 px-5 py-4 transition-colors hover:bg-wash/70 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center sm:px-6" key={`${item.asset}-${item.venue}-${index}`}><span className="font-semibold">{item.flag} {item.asset}</span><span className="text-sm text-muted">via {item.venue}</span><time className="text-xs text-muted">{item.ago}</time></li>)}</ul>
        </section>
      ) : <EmptyState title="No routes recorded yet" detail="This becomes useful as soon as a buyer presses a permitted buy action. It intentionally does not use sample activity." />}
    </div>
  );
}

function Metric({ label, value, detail }: { label: string; value: number; detail?: string }) {
  return <article className="min-h-32 rounded-card bg-surface p-5 shadow-[0_8px_28px_rgb(34_25_78/0.05)] ring-1 ring-line"><p className="text-sm text-muted">{label}</p><p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>{detail ? <p className="mt-1 text-xs text-muted">{detail}</p> : null}</article>;
}
