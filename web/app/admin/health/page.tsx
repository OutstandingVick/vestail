"use client";

import { Info } from "@phosphor-icons/react";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { StatusPill } from "@/components/admin/StatusPill";
import { useAdminOverview } from "@/components/admin/AdminContext";

export default function AdminHealthPage() {
  const { health } = useAdminOverview();
  return (
    <div className="space-y-7">
      <AdminHeader title="Product health" description="A lightweight read of the services needed to assemble this dashboard. Refresh after fixing a dependency." />
      <section className="grid gap-4 md:grid-cols-2" aria-label="Service checks">
        {health.map(check => (
          <article key={check.name} className="min-h-40 rounded-card bg-surface p-5 shadow-[0_8px_28px_rgb(34_25_78/0.05)] ring-1 ring-line">
            <div className="flex items-start justify-between gap-4"><h2 className="font-bold">{check.name}</h2><StatusPill status={check.status} /></div>
            <p className="mt-5 max-w-prose text-sm leading-6 text-muted">{check.detail}</p>
          </article>
        ))}
      </section>
      <aside className="flex max-w-4xl gap-3 rounded-card bg-action-wash p-5 text-sm leading-6 text-muted ring-1 ring-action/15"><Info className="mt-0.5 shrink-0 text-action-ink" size={20} weight="bold" aria-hidden="true" /><p><strong className="text-ink">A snapshot, not uptime monitoring.</strong> These checks only confirm that data could be read while this page loaded. They do not verify downstream trade execution.</p></aside>
    </div>
  );
}
