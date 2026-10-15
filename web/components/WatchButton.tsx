"use client";

import { Star } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

import { authedFetch, errorOf } from "@/lib/client";

/** Add this asset (or one ticker under it) to the watchlist on the portfolio. */
export function WatchButton({ asset, symbol }: { asset: string; symbol?: string }) {
  const [watching, setWatching] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    authedFetch("/api/watchlist").then(async res => {
      if (res.ok) {
        const list: { asset: string; symbol?: string }[] = await res.json();
        setWatching(list.some(w => w.asset === asset && (w.symbol ?? null) === (symbol ?? null)));
      }
      setBusy(false);
    }).catch(() => { setError("Unable to read your watchlist."); setBusy(false); });
  }, [asset, symbol]);
  async function toggle() {
    setBusy(true);
    setError(null);
    const res = await authedFetch("/api/watchlist", { method: "POST", body: JSON.stringify({ asset, symbol, on: !watching }) });
    if (res.ok) setWatching(!watching);
    else setError(await errorOf(res, "Unable to update your watchlist."));
    setBusy(false);
  }
  return (
    <span className="inline-flex flex-col items-end gap-1">
    <button type="button" onClick={toggle} disabled={busy} aria-pressed={watching}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emphasis disabled:cursor-wait disabled:opacity-60 ${watching ? "bg-tint text-emphasis" : "border-[1.5px] border-field"}`}>
      <Star size={16} weight={watching ? "fill" : "regular"} aria-hidden="true" />
      {watching ? "Watching" : "Watch"}
    </button>
    {error && <span role="alert" className="max-w-56 text-right text-xs text-cannot">{error}</span>}
    </span>
  );
}
