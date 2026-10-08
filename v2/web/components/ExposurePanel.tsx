"use client";

import { useState } from "react";

import { authedFetch, errorOf } from "@/lib/client";
import type { Market } from "@/lib/types";

/**
 * Route to a commodity perpetual on trade.xyz. Locked until the buyer
 * acknowledges what it is: price exposure, no commodity, liquidation risk.
 * Cannot-own and not-assessed markets show nothing to press.
 */
export function ExposurePanel({ market }: { market: Market }) {
  const [ack, setAck] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const routable = market.status === "can_own" || market.status === "conditional";
  const locked = market.status === "conditional" && !ack;

  async function go() {
    setError(null);
    const tab = window.open("about:blank", "_blank");
    const res = await authedFetch("/api/order/market", { method: "POST", body: JSON.stringify({ market: market.id, acknowledged: ack }) });
    if (!res.ok) { tab?.close(); return setError(await errorOf(res, "That route was refused.")); }
    const { redirect } = await res.json();
    if (tab) { tab.opener = null; tab.location.href = redirect; } else window.location.href = redirect;
  }

  if (!routable) {
    return (
      <aside className="flex flex-col gap-3 rounded-panel bg-surface p-6">
        <h2 className="text-xl font-bold">Trading</h2>
        <p className="text-[15px]">{market.status === "cannot_own"
          ? "This market isn't available in your declared country, so Vestail doesn't route it."
          : "No rule covers this market in your country yet, so Vestail won't route it until someone checks."}</p>
      </aside>
    );
  }

  return (
    <aside className="flex flex-col gap-4 rounded-panel bg-surface p-6">
      <h2 className="text-xl font-bold">Trade {market.name} exposure</h2>
      {market.status === "conditional" && (
        <div className="flex flex-col gap-3 rounded-field bg-cond-wash p-4">
          <strong className="text-[15px] text-cond-ink">Price exposure only: read before you trade</strong>
          <p className="text-sm text-cond-ink">{market.issuer?.summary}</p>
          <label className="flex min-h-11 cursor-pointer items-start gap-2.5 text-sm">
            <input type="checkbox" checked={ack} onChange={e => setAck(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-action" />
            <span>I understand I won&apos;t own any {market.name.toLowerCase()}, and a leveraged position can be liquidated.</span>
          </label>
        </div>
      )}
      <button type="button" onClick={go} disabled={locked}
        className="flex min-h-12 items-center justify-between rounded-full bg-action px-5 font-semibold text-on-action disabled:cursor-not-allowed disabled:bg-field disabled:text-muted">
        <span>Trade on trade.xyz</span><span aria-hidden="true">↗</span>
      </button>
      <p className="text-xs text-muted">
        Opens trade.xyz, which runs this market on Hyperliquid. You deposit USDC there; Vestail never holds funds or places orders.
        The route is recorded and tagged ref=vestail, and refused server-side without the acknowledgement.
      </p>
      {error && <p role="alert" className="text-sm text-cannot">{error}</p>}
    </aside>
  );
}
