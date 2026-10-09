"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { authedFetch, errorOf } from "@/lib/client";
import type { ActivityItem } from "@/lib/types";

const CHAINS = ["all", "solana", "base", "robinhood", "hyperliquid"] as const;
const CHAIN_NAME: Record<string, string> = { all: "All chains", solana: "Solana", base: "Base", robinhood: "Robinhood Chain", hyperliquid: "Hyperliquid" };

export function ActivityHistory() {
  const searchParams = useSearchParams();
  const requested = searchParams.get("chain") ?? "all";
  const chain = CHAINS.includes(requested as (typeof CHAINS)[number]) ? requested : "all";
  const [items, setItems] = useState<ActivityItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authedFetch("/api/activity")
      .then(async response => response.ok ? setItems(await response.json()) : setError(await errorOf(response, "Couldn't load your activity.")))
      .catch(() => setError("Couldn't reach Vestail. Check your connection and reload."));
  }, []);

  const counts = useMemo(() => Object.fromEntries(CHAINS.map(value => [value, value === "all" ? items?.length ?? 0 : items?.filter(item => item.chain === value).length ?? 0])), [items]);
  const visible = useMemo(() => items?.filter(item => chain === "all" || item.chain === chain) ?? [], [chain, items]);

  if (error) return <p role="alert" className="rounded-field bg-cond-wash px-4 py-4 text-sm text-cond-ink">{error}</p>;
  if (!items) return <div role="status" aria-label="Loading activity" className="flex flex-col gap-3" aria-busy="true">{[1, 2, 3].map(row => <div key={row} className="h-20 animate-pulse rounded-card bg-surface" />)}</div>;

  return (
    <div className="flex flex-col gap-5">
      <nav aria-label="Filter activity by chain" className="flex flex-wrap gap-2">
        {CHAINS.map(value => (
          <Link key={value} href={value === "all" ? "/app/activity" : `/app/activity?chain=${value}`} aria-current={chain === value ? "page" : undefined}
            className={`flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold ${chain === value ? "border-ink-strong bg-ink-strong text-page" : "border-line bg-surface hover:bg-tint"}`}>
            {CHAIN_NAME[value]} <span className="text-xs opacity-70">{counts[value]}</span>
          </Link>
        ))}
      </nav>

      {visible.length ? (
        <div className="overflow-x-auto rounded-panel bg-surface">
          <table className="w-full min-w-[780px] text-left text-sm">
            <thead className="text-xs text-muted"><tr><th className="px-5 py-4 font-medium">Date and time</th><th className="px-3 py-4 font-medium">What</th><th className="px-3 py-4 font-medium">Chain</th><th className="px-3 py-4 font-medium">Venue</th><th className="px-3 py-4 font-medium">Buyer context</th><th className="px-5 py-4 font-medium">Condition</th></tr></thead>
            <tbody>
              {visible.map(item => (
                <tr key={item.id} className="border-t border-line align-top">
                  <td className="px-5 py-4 tabular-nums"><time dateTime={item.at}>{when(item.at)}</time></td>
                  <td className="px-3 py-4"><strong>{item.name}</strong>{item.symbol && item.symbol !== item.name && <div className="text-xs text-muted">{item.symbol}</div>}</td>
                  <td className="px-3 py-4"><span className="rounded-full bg-tint px-2.5 py-1 text-xs font-semibold">{item.chain_label ?? "Offchain"}</span></td>
                  <td className="px-3 py-4">{item.venue}</td>
                  <td className="px-3 py-4"><span className="font-semibold">{item.country_label ?? item.country}</span><div className="text-xs capitalize text-muted">{item.who}</div></td>
                  <td className="px-5 py-4">{item.acknowledged ? <span className="rounded-full bg-cond-wash px-2.5 py-1 text-xs font-semibold text-cond-ink">Condition acknowledged</span> : <span className="text-muted">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-panel bg-surface px-6 py-14 text-center"><h2 className="text-xl font-bold">No buys yet</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{chain === "all" ? "Your routed buys will appear here." : `No recorded buys on ${CHAIN_NAME[chain]}.`}</p><Link href="/app/markets" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-action px-5 font-bold text-on-action">Browse markets</Link></div>
      )}
    </div>
  );
}

const when = (iso: string) => new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
