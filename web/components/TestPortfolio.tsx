"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { readSimulatedHoldings, resetSimulatedHoldings, type SimulatedHolding } from "@/lib/test-mode";
import { VerdictBadge } from "@/components/VerdictBadge";

const usd = (value: number) => value.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });

export function TestPortfolio() {
  const [holdings, setHoldings] = useState<SimulatedHolding[] | null>(null);
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    try {
      setHoldings(readSimulatedHoldings(window.localStorage));
    } catch {
      setHoldings([]);
    }
  }, []);
  const total = useMemo(() => holdings?.reduce((sum, item) => sum + item.amountUsd, 0) ?? 0, [holdings]);

  function reset() {
    try {
      resetSimulatedHoldings(window.localStorage);
    } catch {
      // The in-memory view can still be cleared when storage is unavailable.
    }
    setHoldings([]);
    setConfirming(false);
  }

  return (
    <div className="flex flex-col gap-7 pt-4">
      <header>
        <p className="mb-2 font-accent text-xs font-bold uppercase tracking-[0.13em] text-action-ink">Test mode</p>
        <h1 className="text-[clamp(36px,5vw,64px)] font-extrabold leading-[1.02] tracking-[-0.05em] text-balance">Test portfolio</h1>
        <p className="mt-3 max-w-2xl leading-7 text-muted">Simulated holdings saved only in this browser. No money moved and no transaction was sent.</p>
      </header>

      {holdings === null && <div className="h-52 rounded-panel bg-surface motion-safe:animate-pulse" role="status"><span className="sr-only">Loading test portfolio…</span></div>}
      {holdings?.length === 0 && (
        <section className="rounded-panel bg-surface px-6 py-14 text-center">
          <h2 className="text-xl font-bold">No simulated holdings yet</h2>
          <p className="mt-2 text-sm text-muted">Choose a stock and simulate a purchase to see it here.</p>
          <Link href="/app/discover" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-action px-5 font-bold text-on-action">Find a stock</Link>
        </section>
      )}
      {holdings && holdings.length > 0 && (
        <>
          <section className="flex flex-wrap items-end justify-between gap-5 rounded-panel bg-surface p-6">
            <div><h2 className="text-sm font-semibold text-muted">Simulated amount</h2><p className="mt-1 font-display text-4xl font-extrabold tabular-nums">{usd(total)}</p></div>
            {!confirming ? (
              <button type="button" onClick={() => setConfirming(true)} className="min-h-11 rounded-full border border-cannot px-4 text-sm font-semibold text-cannot">Reset portfolio</button>
            ) : (
              <div role="group" aria-label="Confirm reset" className="flex flex-wrap items-center gap-2">
                <span className="text-sm">Remove all simulated holdings?</span>
                <button type="button" onClick={reset} className="min-h-11 rounded-full bg-cannot px-4 text-sm font-semibold text-white">Remove all</button>
                <button type="button" onClick={() => setConfirming(false)} className="min-h-11 rounded-full border border-field px-4 text-sm font-semibold">Cancel</button>
              </div>
            )}
          </section>
          <section aria-labelledby="test-holdings-title">
            <h2 id="test-holdings-title" className="mb-3 text-xl font-bold">Simulated holdings</h2>
            <ul className="grid gap-4 md:grid-cols-2">
              {holdings.map(item => (
                <li key={item.id} className="rounded-panel bg-surface p-5">
                  <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.12em] text-action-ink">{item.symbol}</p><h3 className="mt-1 text-xl font-bold">{item.tokenSymbol}</h3></div><VerdictBadge status={item.verdict} /></div>
                  <dl className="mt-5 grid grid-cols-2 gap-2 text-sm">
                    <dt className="text-muted">Amount</dt><dd className="text-right font-semibold tabular-nums">{usd(item.amountUsd)}</dd>
                    <dt className="text-muted">Estimated units</dt><dd className="text-right font-semibold tabular-nums">{item.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}</dd>
                    <dt className="text-muted">Price used</dt><dd className="text-right font-semibold tabular-nums">{usd(item.priceUsd)}</dd>
                    <dt className="text-muted">Issuer</dt><dd className="text-right font-semibold">{item.issuer}</dd>
                  </dl>
                  <p className="mt-4 text-xs text-muted">Simulated {new Date(item.createdAt).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
