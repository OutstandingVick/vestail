"use client";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { CoverageBar } from "@/components/admin/CoverageBar";
import { EmptyState } from "@/components/admin/EmptyState";
import { useAdminOverview } from "@/components/admin/AdminContext";

export default function AdminCoveragePage() {
  const { coverage } = useAdminOverview();
  return <div className="space-y-7"><AdminHeader title="Rule coverage" description="Every country is shown twice because citizen and foreign-buyer answers can differ. Counts come from the current rule matrix." />{coverage.length ? <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{coverage.map(row => { const total = Object.values(row.totals).reduce((a, b) => a + b, 0); return <article key={`${row.country}-${row.who}`} className="rounded-card border border-line bg-surface p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="font-bold">{row.name}</h2><p className="mt-1 text-xs capitalize text-muted">{row.who}</p></div><span className="text-sm font-semibold tabular-nums">{total}</span></div><div className="mt-5"><CoverageBar totals={row.totals} /></div><dl className="mt-4 grid grid-cols-3 gap-2 text-center"><div><dt className="text-[11px] text-muted">Can own</dt><dd className="mt-1 font-bold tabular-nums text-can">{row.totals.can_own}</dd></div><div><dt className="text-[11px] text-muted">Conditional</dt><dd className="mt-1 font-bold tabular-nums text-cond">{row.totals.conditional}</dd></div><div><dt className="text-[11px] text-muted">Cannot</dt><dd className="mt-1 font-bold tabular-nums text-cannot">{row.totals.cannot_own}</dd></div></dl></article>; })}</section> : <EmptyState title="Rule coverage is unavailable" detail="No matrix rows were returned. Check the API health page before relying on coverage counts." />}</div>;
}
