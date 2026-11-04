"use client";

import { Activity, ArrowSquareOut } from "@phosphor-icons/react";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { EmptyState } from "@/components/admin/EmptyState";
import { useAdminOverview } from "@/components/admin/AdminContext";

export default function AdminActivityPage() {
  const { activity } = useAdminOverview();
  return (
    <div className="space-y-7">
      <AdminHeader title="Activity" description="A privacy-conscious view of server-side route use. Query strings and request bodies are never retained." />
      <section className="grid gap-4 sm:grid-cols-3" aria-label="Activity totals">
        <Metric label="Requests" value={activity.total} />
        <Metric label="Successful" value={activity.successful} />
        <Metric label="Blocked or failed" value={activity.blocked} />
      </section>
      {activity.recent.length ? (
        <section className="overflow-hidden rounded-card bg-surface shadow-[0_8px_28px_rgb(34_25_78/0.05)] ring-1 ring-line">
          <header className="flex items-center gap-3 p-5 sm:px-6"><span className="grid size-9 place-items-center rounded-full bg-action-wash text-action-ink"><Activity size={18} weight="bold" aria-hidden="true" /></span><div><h2 className="font-bold">Latest route events</h2><p className="text-xs text-muted">Newest first</p></div></header>
          <ul className="divide-y divide-line border-t border-line">{activity.recent.map((event, index) => <li className="grid gap-3 px-5 py-4 hover:bg-wash/70 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:px-6" key={`${event.at}-${index}`}><div className="flex min-w-0 items-center gap-3"><span className={`size-2 shrink-0 rounded-full ${event.status >= 400 ? "bg-cannot" : "bg-can"}`} aria-hidden="true" /><code className="truncate text-xs font-semibold">{event.method} {event.route}</code></div><span className="text-xs tabular-nums text-muted">{event.durationMs} ms</span><time className="text-xs text-muted" dateTime={event.at}>{new Date(event.at).toLocaleString()}</time></li>)}</ul>
        </section>
      ) : <EmptyState title="No route activity yet" detail="Events appear here after owner routes receive traffic." icon={<ArrowSquareOut size={28} aria-hidden="true" />} />}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <article className="rounded-card bg-surface p-5 shadow-[0_8px_28px_rgb(34_25_78/0.05)] ring-1 ring-line"><p className="text-sm text-muted">{label}</p><p className="mt-2 text-3xl font-bold tabular-nums">{value}</p></article>;
}
