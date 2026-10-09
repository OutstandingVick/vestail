"use client";

import { List, SquaresFour } from "@phosphor-icons/react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { VerdictBadge } from "@/components/VerdictBadge";
import type { Status } from "@/lib/types";

const KINDS = ["All", "Local advantage", "Buy onchain", "Within reach", "Price exposure", "Open elsewhere"] as const;
const VERDICTS: { label: string; value: "all" | Status }[] = [
  { label: "All verdicts", value: "all" }, { label: "Can own", value: "can_own" },
  { label: "Conditional", value: "conditional" }, { label: "Cannot own here", value: "cannot_own" },
];

export type DiscoverKind = Exclude<(typeof KINDS)[number], "All">;
export interface DiscoverRow { id: string; name: string; symbol: string; kind: DiscoverKind; status: Status; detail: string; reach: string; href: string }

const KIND_TONE: Record<DiscoverKind, string> = {
  "Local advantage": "bg-action-wash text-action-ink", "Buy onchain": "bg-tint text-emphasis",
  "Within reach": "bg-cond-wash text-cond-ink", "Price exposure": "bg-wash text-muted", "Open elsewhere": "bg-wash text-muted",
};

export function DiscoverExplorer({ rows, country, buyer, countryCode }: { rows: DiscoverRow[]; country: string; buyer: string; countryCode: string }) {
  const [kind, setKind] = useState<(typeof KINDS)[number]>("All");
  const [verdict, setVerdict] = useState<"all" | Status>("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"list" | "grid">("list");
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter(row => (kind === "All" || row.kind === kind) && (verdict === "all" || row.status === verdict)
      && (!needle || `${row.name} ${row.symbol} ${row.kind} ${row.detail}`.toLowerCase().includes(needle)));
  }, [kind, query, rows, verdict]);

  return (
    <div className="flex flex-col gap-7 pb-2 pt-4 sm:gap-9">
      <header className="flex flex-col gap-5 border-b border-line pb-8 sm:pb-10">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-[760px]">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.13em] text-action-ink">Ownership opportunities</p>
            <h1 className="text-[clamp(36px,5vw,68px)] font-extrabold leading-[1.02] tracking-[-0.055em] text-balance">Discover what&apos;s open to you.</h1>
            <p className="mt-4 max-w-[680px] text-base leading-7 text-muted sm:text-lg">Browse assets, onchain versions, and price exposure assessed for a <span className="font-semibold text-ink">{buyer}</span> in <span className="font-semibold text-ink">{country}</span>.</p>
          </div>
          <Link href="/app/settings" className="inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-4 text-sm font-semibold hover:bg-tint">Change buyer profile</Link>
        </div>
        <div className="rounded-card border border-line bg-surface p-4 sm:p-5">
          <div className="grid gap-5">
            <fieldset><legend className="mb-2.5 text-xs font-semibold text-muted">Opportunity type</legend><div className="flex flex-wrap gap-2">
              {KINDS.map(value => <button key={value} type="button" onClick={() => setKind(value)} aria-pressed={kind === value} className={`min-h-10 rounded-full border px-4 text-sm font-semibold transition-colors ${kind === value ? "border-action bg-action text-on-action" : "border-line bg-page text-ink hover:bg-tint"}`}>{value}</button>)}
            </div></fieldset>
            <fieldset><legend className="mb-2.5 text-xs font-semibold text-muted">Availability in {countryCode}</legend><div className="flex flex-wrap gap-2">
              {VERDICTS.map(option => <button key={option.value} type="button" onClick={() => setVerdict(option.value)} aria-pressed={verdict === option.value} className={`min-h-10 rounded-full border px-4 text-sm font-semibold transition-colors ${verdict === option.value ? "border-ink-strong bg-ink-strong text-surface" : "border-line bg-page text-ink hover:bg-tint"}`}>{option.label}</button>)}
            </div></fieldset>
          </div>
        </div>
      </header>

      <section aria-labelledby="results-title" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 id="results-title" className="text-xl font-bold">Opportunities</h2><p aria-live="polite" className="mt-1 text-sm text-muted">{visible.length} {visible.length === 1 ? "result" : "results"} for your current profile</p></div>
          <div className="flex items-center gap-2">
            <label className="sr-only" htmlFor="discover-search">Search opportunities</label>
            <input id="discover-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search assets" className="min-h-11 w-[min(58vw,260px)] rounded-full border border-line bg-surface px-4 text-base outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-action" />
            <div className="hidden rounded-full border border-line bg-surface p-1 sm:flex" aria-label="Result view">
              <button type="button" onClick={() => setView("list")} aria-pressed={view === "list"} aria-label="List view" className={`grid size-9 place-items-center rounded-full ${view === "list" ? "bg-ink-strong text-surface" : "text-muted hover:bg-tint"}`}><List size={18} weight={view === "list" ? "fill" : "regular"} aria-hidden="true" /></button>
              <button type="button" onClick={() => setView("grid")} aria-pressed={view === "grid"} aria-label="Grid view" className={`grid size-9 place-items-center rounded-full ${view === "grid" ? "bg-ink-strong text-surface" : "text-muted hover:bg-tint"}`}><SquaresFour size={18} weight={view === "grid" ? "fill" : "regular"} aria-hidden="true" /></button>
            </div>
          </div>
        </div>
        {visible.length === 0 ? <EmptyState onReset={() => { setKind("All"); setVerdict("all"); setQuery(""); }} /> : view === "grid" ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{visible.map((row, index) => <DiscoverCard key={row.id} row={row} index={index} />)}</div>
        ) : (
          <div className="overflow-hidden rounded-card border border-line bg-surface">
            <div className="hidden grid-cols-[52px_minmax(190px,1.2fr)_minmax(130px,.7fr)_minmax(130px,.8fr)_minmax(110px,.6fr)_88px] gap-4 border-b border-line px-5 py-3 text-xs font-semibold text-muted lg:grid"><span>#</span><span>Opportunity</span><span>Type</span><span>Availability</span><span>Reach</span><span className="text-end">Action</span></div>
            <ol className="divide-y divide-line">{visible.map((row, index) => <DiscoverListRow key={row.id} row={row} index={index} />)}</ol>
          </div>
        )}
      </section>
      <p className="rounded-card bg-tint px-5 py-4 text-sm leading-6 text-muted"><strong className="text-ink">Check before you act.</strong> Asset-class rules are not sourced yet and should be treated as guidance. Onchain versions are assessed against their issuers&apos; published terms.</p>
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return <div className="rounded-card border border-line bg-surface px-5 py-12 text-center"><h3 className="font-bold">No matching opportunities</h3><p className="mt-2 text-sm text-muted">Try another search or reset the filters.</p><button type="button" onClick={onReset} className="mt-5 min-h-11 rounded-full bg-action px-5 font-bold text-on-action">Reset filters</button></div>;
}

function DiscoverListRow({ row, index }: { row: DiscoverRow; index: number }) {
  return <li><Link href={row.href} className="group grid min-h-[86px] grid-cols-[42px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 hover:bg-wash focus-visible:bg-wash lg:grid-cols-[52px_minmax(190px,1.2fr)_minmax(130px,.7fr)_minmax(130px,.8fr)_minmax(110px,.6fr)_88px] lg:gap-4 lg:px-5">
    <span className="text-sm tabular-nums text-muted">{String(index + 1).padStart(2, "0")}</span>
    <span className="flex min-w-0 items-center gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-tint font-bold text-emphasis">{row.symbol.slice(0, 3)}</span><span className="min-w-0"><strong className="block truncate text-[15px]">{row.name}</strong><span className="mt-0.5 block truncate text-xs text-muted">{row.detail}</span></span></span>
    <span className={`hidden w-fit rounded-full px-2.5 py-1 text-xs font-semibold lg:inline-flex ${KIND_TONE[row.kind]}`}>{row.kind}</span><span className="hidden lg:block"><VerdictBadge status={row.status} /></span><span className="hidden text-sm text-muted lg:block">{row.reach}</span><span className="justify-self-end text-sm font-bold text-action-ink">View <span aria-hidden="true">→</span></span>
    <span className="col-start-2 flex flex-wrap items-center gap-2 lg:hidden"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${KIND_TONE[row.kind]}`}>{row.kind}</span><VerdictBadge status={row.status} /></span>
  </Link></li>;
}

function DiscoverCard({ row, index }: { row: DiscoverRow; index: number }) {
  return <Link href={row.href} className="group flex min-h-[250px] flex-col rounded-card border border-line bg-surface p-5 hover:bg-wash focus-visible:bg-wash">
    <div className="flex items-start justify-between gap-3"><span className="grid size-12 place-items-center rounded-xl bg-tint font-bold text-emphasis">{row.symbol.slice(0, 3)}</span><span className="text-xs tabular-nums text-muted">{String(index + 1).padStart(2, "0")}</span></div>
    <div className="mt-8"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${KIND_TONE[row.kind]}`}>{row.kind}</span><h3 className="mt-3 text-lg font-bold">{row.name}</h3><p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">{row.detail}</p></div>
    <div className="mt-auto flex items-end justify-between gap-3 pt-5"><VerdictBadge status={row.status} /><span className="text-sm font-bold text-action-ink">View <span aria-hidden="true">→</span></span></div>
  </Link>;
}
