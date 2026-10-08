"use client";

import { useEffect, useState } from "react";

import { authedFetch } from "@/lib/client";

/** Add this asset (or one ticker under it) to the watchlist on the portfolio. */
export function WatchButton({ asset, symbol }: { asset: string; symbol?: string }) {
  const [watching, setWatching] = useState(false);
  const [busy, setBusy] = useState(true);
  useEffect(() => {
    authedFetch("/api/watchlist").then(async res => {
      if (res.ok) {
        const list: { asset: string; symbol?: string }[] = await res.json();
        setWatching(list.some(w => w.asset === asset && (w.symbol ?? null) === (symbol ?? null)));
      }
      setBusy(false);
    });
  }, [asset, symbol]);
  async function toggle() {
    setBusy(true);
    const res = await authedFetch("/api/watchlist", { method: "POST", body: JSON.stringify({ asset, symbol, on: !watching }) });
    if (res.ok) setWatching(!watching);
    setBusy(false);
  }
  return (
    <button type="button" onClick={toggle} disabled={busy} aria-pressed={watching}
      className={`min-h-10 rounded-full px-4 text-sm font-semibold ${watching ? "bg-tint text-emphasis" : "border-[1.5px] border-field"}`}>
      {watching ? "★ Watching" : "☆ Watch"}
    </button>
  );
}
