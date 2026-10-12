"use client";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { useAdminOverview } from "@/components/admin/AdminContext";

export default function AdminActivityPage() {
  const { activity } = useAdminOverview();
  return <div className="space-y-7"><AdminHeader title="Routing activity" description="Recorded handoffs from Vestail to a venue. A route is intent, not proof that a trade completed." /><section className="rounded-card border border-line bg-surface p-5 sm:p-6"><div className="flex flex-wrap items-baseline justify-between gap-3"><div><p className="text-sm font-semibold text-muted">All recorded routes</p><p className="mt-2 text-4xl font-bold tabular-nums">{activity.stats.orders_routed}</p></div><p className="rounded-full bg-wash px-3 py-1.5 text-xs font-semibold">{activity.stats.active_buyers_7d} active buyers · 7 days</p></div></section>{activity.recent.length ? <section className="overflow-hidden rounded-card border border-line bg-surface"><h2 className="px-5 pt-5 text-xl font-bold">Latest handoffs</h2><ul className="mt-3 divide-y divide-line">{activity.recent.map((item, index) => <li key={`${item.asset}-${item.venue}-${index}`} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_1fr_auto] sm:items-center"><span className="font-semibold">{item.flag} {item.asset}</span><span className="text-sm text-muted">via {item.venue}</span><time className="text-xs text-muted">{item.ago}</time></li>)}</ul></section> : <EmptyState title="No routes recorded yet" detail="This becomes useful as soon as a buyer presses a permitted buy action. It intentionally does not use sample activity." />}</div>;
}
