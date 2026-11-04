"use client";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { CoverageBar } from "@/components/admin/CoverageBar";
import { EmptyState } from "@/components/admin/EmptyState";
import { useAdminOverview } from "@/components/admin/AdminContext";

export default function AdminCoveragePage() {
  const { coverage } = useAdminOverview();
  return (
    <div className="space-y-7">
      <AdminHeader title="Rule coverage" description="Every country is shown twice because citizen and foreign-buyer answers can differ. Counts come from the current rule matrix." />
      {coverage.length ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Rule coverage by country">
          {coverage.map(row => {
            const total = Object.values(row.totals).reduce((sum, value) => sum + value, 0);
            return (
              <article key={`${row.country}-${row.who}`} className="rounded-card bg-surface p-5 shadow-[0_8px_28px_rgb(34_25_78/0.05)] ring-1 ring-line">
                <div className="flex items-start justify-between gap-4"><div><h2 className="font-bold">{row.name}</h2><p className="mt-1 text-xs font-medium capitalize text-muted">{row.who} buyer</p></div><span className="rounded-full bg-wash px-2.5 py-1 text-xs font-semibold tabular-nums">{total} rules</span></div>
                <div className="mt-5"><CoverageBar totals={row.totals} /></div>
                <dl className="mt-4 grid grid-cols-3 gap-2 rounded-[16px] bg-wash p-3 text-center"><Verdict label="Can own" value={row.totals.can_own} tone="text-can" /><Verdict label="Conditional" value={row.totals.conditional} tone="text-cond" /><Verdict label="Cannot" value={row.totals.cannot_own} tone="text-cannot" /></dl>
              </article>
            );
          })}
        </section>
      ) : <EmptyState title="Rule coverage is unavailable" detail="No matrix rows were returned. Check the API health page before relying on coverage counts." />}
    </div>
  );
}

function Verdict({ label, value, tone }: { label: string; value: number; tone: string }) {
  return <div><dt className="text-[11px] text-muted">{label}</dt><dd className={`mt-1 font-bold tabular-nums ${tone}`}>{value}</dd></div>;
}
