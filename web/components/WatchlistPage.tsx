"use client";

import { useEffect, useState } from "react";

import { authedFetch, errorOf } from "@/lib/client";
import type { WatchlistRow } from "@/lib/types";

interface Summary { items: WatchlistRow[]; errors: string[] }

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
    </div>
  );
}
