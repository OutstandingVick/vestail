"use client";

import {
  ChartBar,
  GlobeHemisphereWest,
  Path,
  UserPlus,
  Users,
  Wallet,
} from "@phosphor-icons/react";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { CoverageBar } from "@/components/admin/CoverageBar";
import { EmptyState } from "@/components/admin/EmptyState";
import { MetricCard } from "@/components/admin/MetricCard";
import { StatusPill } from "@/components/admin/StatusPill";
import { useAdminOverview } from "@/components/admin/AdminContext";

export default function AdminOverviewPage() {
  const data = useAdminOverview();
  const firstCoverage = data.coverage.slice(0, 6);
  return (
    <div className="space-y-8">
      <AdminHeader
        title="Product overview"
        description="The live signals that tell you whether Vestail is growing, routing, and covering the markets it promises."
      />
      <section
        aria-label="Key metrics"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        <MetricCard
          label="Total users"
          value={data.users.total}
          detail={`${data.users.profiled} completed buyer profiles`}
          icon={Users}
        />
        <MetricCard
          label="New users · 7 days"
          value={data.users.recent7d}
          detail="Based on Privy account creation"
          icon={UserPlus}
        />
        <MetricCard
          label="Linked wallets"
          value={data.users.wallets}
          detail="Wallet accounts attached to users"
          icon={Wallet}
        />
        <MetricCard
          label="Routes recorded"
          value={data.activity.stats.orders_routed}
          detail={`${data.activity.stats.active_buyers_7d} active buyers in 7 days`}
          icon={Path}
        />
        <MetricCard
          label="Countries covered"
          value={data.catalog.countries}
          detail={`${data.catalog.assets} ownership classes`}
          icon={GlobeHemisphereWest}
        />
        <MetricCard
          label="Tradable catalog"
          value={data.catalog.tokenSymbols}
          detail={`${data.catalog.tokenSymbols} token symbols`}
          icon={ChartBar}
        />
      </section>
      <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <section className="rounded-card border border-line bg-surface p-5 sm:p-6">
          <h2 className="text-xl font-bold">Coverage snapshot</h2>
          <p className="mt-1 text-sm text-muted">
            First six live country and buyer-type matrices.
          </p>
          {firstCoverage.length ? (
            <div className="mt-5 space-y-5">
              {firstCoverage.map((row) => (
                <div key={`${row.country}-${row.who}`}>
                  <div className="mb-2 flex justify-between gap-4 text-sm">
                    <span className="font-semibold">
                      {row.name} ·{" "}
                      <span className="font-normal capitalize text-muted">
                        {row.who}
                      </span>
                    </span>
                    <span className="tabular-nums text-muted">
                      {Object.values(row.totals).reduce((a, b) => a + b, 0)}{" "}
                      rules
                    </span>
                  </div>
                  <CoverageBar totals={row.totals} />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-5">
              <EmptyState
                title="Coverage is unavailable"
                detail="The rule API did not return matrix data for this refresh."
              />
            </div>
          )}
        </section>
        <section className="rounded-card border border-line bg-surface p-5 sm:p-6">
          <h2 className="text-xl font-bold">System status</h2>
          <div className="mt-3 divide-y divide-line">
            {data.health.map((item) => (
              <div
                key={item.name}
                className="flex items-start justify-between gap-4 py-4"
              >
                <div>
                  <p className="text-sm font-semibold">{item.name}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    {item.detail}
                  </p>
                </div>
                <StatusPill status={item.status} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
