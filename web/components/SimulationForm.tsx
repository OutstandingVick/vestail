"use client";

import Link from "next/link";
import { useState } from "react";

import { addSimulatedHolding, simulationAllowed, type SimulationQuote } from "@/lib/test-mode";
import type { Token } from "@/lib/types";

const ISSUER: Record<string, string> = {
  xstocks: "xStocks (Backed Finance)", ondo: "Ondo Global Markets", backpack: "Backpack Securities",
  tessera: "Tessera", prestocks: "PreStocks", robinhood: "Robinhood (Jersey)", coinbase: "Coinbase",
};
const usd = (value: number) => value.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });

/** A price-backed rehearsal that never requests, signs, records, or sends a transaction. */
export function SimulationForm({ symbol, tokens, acknowledged, locked }: {
  symbol: string; tokens: Token[]; acknowledged: boolean; locked: boolean;
}) {
  const [address, setAddress] = useState(tokens[0]?.address ?? "");
  const [amount, setAmount] = useState("100");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<SimulationQuote | null>(null);
  const token = tokens.find(item => item.address === address);

  async function simulate() {
    setError(null);
    setConfirmation(null);
    if (!token) return setError("Choose a token version.");
    const permission = simulationAllowed(token.assessed ? token.status : null, acknowledged);
    if (!permission.ok) return setError(permission.error);
    const amountUsd = Number(amount);
    if (!Number.isFinite(amountUsd) || amountUsd < 1 || amountUsd > 100_000) return setError("Enter an amount between 1 and 100,000 USD.");
    setBusy(true);
    try {
      const response = await fetch("/api/test-mode/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, address, amountUsd, acknowledged }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error ?? "Unable to simulate this purchase.");
      const quote = body as SimulationQuote;
      addSimulatedHolding(window.localStorage, {
        ...quote,
        id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${quote.tokenSymbol}`,
        createdAt: new Date().toISOString(),
      });
      setConfirmation(quote);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to simulate this purchase. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label htmlFor={`test-token-${symbol}`} className="text-sm">Version</label>
      <select id={`test-token-${symbol}`} value={address} onChange={event => { setAddress(event.target.value); setConfirmation(null); }} className="min-h-11 rounded-field border-[1.5px] border-field bg-wash px-3">
        {tokens.map(item => <option key={item.address} value={item.address}>{item.token_symbol} · {item.chain_name}</option>)}
      </select>
      <label htmlFor={`test-amount-${symbol}`} className="text-sm">Test amount (USD)</label>
      <input id={`test-amount-${symbol}`} inputMode="decimal" value={amount} onChange={event => { setAmount(event.target.value); setConfirmation(null); }} className="min-h-12 rounded-field border-[1.5px] border-field bg-wash px-3.5 text-lg" />
      <button type="button" onClick={simulate} disabled={locked || busy} className="min-h-12 rounded-full bg-action px-4 font-semibold text-on-action focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emphasis disabled:cursor-not-allowed disabled:bg-field disabled:text-muted">
        {busy ? "Simulating…" : "Simulate purchase"}
      </button>
      {locked && <p className="text-[13px] text-muted">Acknowledge the condition above to continue.</p>}
      {error && <p role="alert" className="text-sm text-cannot">{error}</p>}
      {confirmation && (
        <div role="status" className="rounded-field bg-tint p-4 text-sm">
          <strong className="text-base">Simulated purchase</strong>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
            <dt className="text-muted">Asset</dt><dd className="text-right font-semibold">{confirmation.symbol}</dd>
            <dt className="text-muted">Amount</dt><dd className="text-right font-semibold tabular-nums">{usd(confirmation.amountUsd)}</dd>
            <dt className="text-muted">Verdict</dt><dd className="text-right font-semibold">{confirmation.verdict === "can_own" ? "Can own" : "Conditional"}</dd>
            <dt className="text-muted">Issuer</dt><dd className="text-right font-semibold">{ISSUER[confirmation.issuer] ?? confirmation.issuer}</dd>
          </dl>
          <p className="mt-3 text-muted">Estimated {confirmation.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })} {confirmation.tokenSymbol} at {usd(confirmation.priceUsd)}. No transaction was sent.</p>
          <Link href="/app/test-portfolio" className="mt-3 inline-flex min-h-11 items-center font-semibold text-emphasis underline underline-offset-2">View test portfolio</Link>
        </div>
      )}
    </div>
  );
}
