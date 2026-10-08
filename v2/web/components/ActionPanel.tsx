"use client";

import { useState } from "react";

import { SwapForm } from "@/components/SwapForm";
import { authedFetch, errorOf } from "@/lib/client";
import type { Status, Token, Venue } from "@/lib/types";

/**
 * Where the buyer acts. The rules, enforced here and again on the server:
 *  - cannot-own: no venues, no prices, nothing to press;
 *  - conditional: every Buy stays locked until the acknowledgement is ticked;
 *  - a token that is not assessed or cannot be owned is never offered.
 */
export function ActionPanel({ assetName, classStatus, venues, symbol, tokens }: {
  assetName: string; classStatus: Status; venues: Venue[]; symbol?: string; tokens: Token[];
}) {
  const [ack, setAck] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const buyable = tokens.filter(t => t.status === "can_own" || t.status === "conditional");
  const onlineVenues = classStatus === "cannot_own" ? [] : venues.filter(v => v.url);
  const conditions = [
    ...(classStatus === "conditional" && onlineVenues.length ? [`${assetName} is conditional where you are: owning it needs a licence, cap, approval or KYC to clear.`] : []),
    ...buyable.filter(t => t.status === "conditional").map(t =>
      t.issuer?.acknowledgement
        ? `${t.token_symbol}: ${t.issuer.acknowledgement.limit} needs ${t.issuer.acknowledgement.requires}.`
        : `${t.token_symbol}: ${t.issuer?.summary ?? "conditional"}`),
  ];
  const venueLocked = classStatus === "conditional" && !ack;
  const swapLocked = buyable.some(t => t.status === "conditional") && !ack;

  async function go(venue: string) {
    setError(null);
    // Open the tab now, inside the click, so popup blockers allow it; point it once the server approves.
    const tab = window.open("about:blank", "_blank");
    const res = await authedFetch("/api/order/click", { method: "POST", body: JSON.stringify({ asset: assetSlug(), venue, acknowledged: ack }) });
    if (!res.ok) { tab?.close(); return setError(await errorOf(res, "That order was refused.")); }
    const { redirect } = await res.json();
    if (tab) { tab.opener = null; tab.location.href = redirect; } else window.location.href = redirect;
  }
  const assetSlug = () => location.pathname.split("/").pop()!;

  if (classStatus === "cannot_own") {
    return (
      <aside className="flex flex-col gap-3 rounded-panel bg-surface p-6">
        <h2 className="text-xl font-bold">Buying</h2>
        <p className="text-[15px]">You can&apos;t own this in your declared country, so Vestail shows no venues or prices for it.</p>
      </aside>
    );
  }

  return (
    <aside className="flex flex-col gap-4 rounded-panel bg-surface p-6">
      <h2 className="text-xl font-bold">Buy {symbol ?? assetName}</h2>

      {conditions.length > 0 && (
        <div className="flex flex-col gap-3 rounded-field bg-cond-wash p-4">
          <strong className="text-[15px] text-cond-ink">Conditional: read before you buy</strong>
          <ul className="flex flex-col gap-1 text-sm text-cond-ink">
            {conditions.map(c => <li key={c}>{c}</li>)}
          </ul>
          <label className="flex min-h-11 cursor-pointer items-start gap-2.5 text-sm">
            <input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-action" />
            <span>I understand I may not be able to redeem, collect on or exit this without meeting the condition.</span>
          </label>
        </div>
      )}

      {symbol && buyable.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="text-[13px] font-semibold tracking-wide text-muted uppercase">Onchain · via Jupiter</h3>
          <SwapForm symbol={symbol} tokens={buyable} acknowledged={ack} locked={swapLocked} />
        </section>
      )}
      {symbol && buyable.length === 0 && (
        <p className="text-sm text-muted">None of the onchain versions can be bought from your country right now.</p>
      )}

      {onlineVenues.length > 0 && (
        <section className={`flex flex-col gap-2 ${symbol ? "border-t border-line pt-3.5" : ""}`}>
          <h3 className="text-[13px] font-semibold tracking-wide text-muted uppercase">Brokers and venues</h3>
          {onlineVenues.map(v => (
            <button
              key={v.name}
              type="button"
              disabled={venueLocked}
              onClick={() => go(v.name)}
              className="flex min-h-11 items-center justify-between rounded-xl bg-action-wash px-4 font-semibold text-action-ink disabled:cursor-not-allowed disabled:bg-wash disabled:text-muted"
            >
              <span>{v.name}</span><span aria-hidden="true">↗</span>
            </button>
          ))}
        </section>
      )}

      {error && <p role="alert" className="text-sm text-cannot">{error}</p>}
      <p className="text-xs text-muted">Every Buy is recorded and tagged ref=vestail. The server refuses it if the acknowledgement is missing.</p>
    </aside>
  );
}
