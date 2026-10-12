"use client";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatusPill } from "@/components/admin/StatusPill";
import { useAdminOverview } from "@/components/admin/AdminContext";

export default function AdminHealthPage() {
  const { health } = useAdminOverview();
  return <div className="space-y-7"><AdminHeader title="Product health" description="A lightweight read of the services needed to assemble this dashboard. Refresh after fixing a dependency." /><section className="grid gap-3 md:grid-cols-2">{health.map(check => <article key={check.name} className="rounded-card border border-line bg-surface p-5"><div className="flex items-start justify-between gap-4"><h2 className="font-bold">{check.name}</h2><StatusPill status={check.status} /></div><p className="mt-4 text-sm leading-6 text-muted">{check.detail}</p></article>)}</section><aside className="rounded-card border border-line bg-wash p-5 text-sm leading-6 text-muted"><strong className="text-ink">What this does not prove:</strong> these checks confirm that data could be read while the page loaded. They are not uptime monitoring and do not verify downstream trade execution.</aside></div>;
}
