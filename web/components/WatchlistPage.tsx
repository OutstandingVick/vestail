"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { authedFetch, errorOf } from "@/lib/client";
import type { WatchlistRow } from "@/lib/types";

interface Summary { items: WatchlistRow[]; errors: string[] }
const usd = (value: number) => value.toLocaleString(undefined, { style: "currency", currency: "USD", minimumFractionDigits: value < 1 ? 4 : 2, maximumFractionDigits: value < 1 ? 6 : 2 });
const movement = (value: number) => `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;

export function WatchlistPage({ countryName }: { countryName: string }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authedFetch("/api/watchlist/summary")
      .then(async response => response.ok ? setSummary(await response.json()) : setError(await errorOf(response, "Unable to load your watchlist.")))
      .catch(() => setError("Unable to reach Vestail. Check your connection and try again."));
  }, []);

  return (
    <div className="flex flex-col gap-7 pt-4">
      <header>
        <p className="mb-2 font-accent text-xs font-bold uppercase tracking-[0.13em] text-action-ink">Saved for later</p>
        <h1 className="text-[clamp(36px,5vw,64px)] font-extrabold leading-[1.02] tracking-[-0.05em]">Watchlist</h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted">Follow stocks you&apos;re considering and see how their tokenized versions are moving before you decide to buy in {countryName}.</p>
      </header>
      {error && <p role="alert" className="rounded-field bg-cond-wash px-4 py-3 text-sm text-cond-ink">{error}</p>}
      {!summary && !error && <div className="h-56 animate-pulse rounded-panel bg-surface" aria-busy="true"><span className="sr-only">Loading your watchlist…</span></div>}
      {summary && summary.items.length === 0 && (
        <section className="flex min-h-72 flex-col items-center justify-center rounded-panel bg-surface px-6 py-14 text-center">
          <h2 className="text-xl font-bold">No stocks saved yet</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-muted">Save a stock when you want more time to compare its versions, ownership rules, and market movement.</p>
          <Link href="/app/discover" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-action px-5 font-bold text-on-action">Find stocks to watch</Link>
        </section>
      )}
      {summary && summary.items.length > 0 && (
        <section aria-labelledby="watched-stocks-title" className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><h2 id="watched-stocks-title" className="text-xl font-bold">Watched stocks</h2><p className="mt-1 text-sm text-muted">{summary.items.length} {summary.items.length === 1 ? "stock" : "stocks"} saved</p></div>
            <Link href="/app/discover" className="inline-flex min-h-11 items-center rounded-full border border-field bg-surface px-4 text-sm font-semibold hover:bg-tint">Add another stock</Link>
          </div>
          <ul className="grid gap-4 md:grid-cols-2">
            {summary.items.map(item => (
              <li key={`${item.asset}:${item.symbol ?? "asset"}`} className="rounded-panel bg-surface p-5 sm:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-action-ink">{item.symbol ?? "Asset class"}</p>
                <h3 className="mt-1 text-xl font-bold">{item.name}</h3>
                <p className="mt-5 font-display text-3xl font-bold tabular-nums">{item.quote ? usd(item.quote.price_usd) : "Price unavailable"}</p>
                {item.quote?.change_24h_pct != null && <p className={`mt-1 text-sm font-semibold tabular-nums ${item.quote.change_24h_pct >= 0 ? "text-can" : "text-cannot"}`}><span aria-hidden="true">{item.quote.change_24h_pct >= 0 ? "↑" : "↓"}</span> {movement(item.quote.change_24h_pct)} over 24 hours</p>}
                {item.quote && item.quote.change_24h_pct == null && <p className="mt-1 text-sm text-muted">24-hour movement unavailable</p>}
                {item.quote && <p className="mt-4 text-xs leading-5 text-muted">Tracking {item.quote.token_symbol} by {item.quote.provider}. Price and movement come from Jupiter&apos;s live Solana market data.</p>}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
