"use client";

import { useSignTransaction, useWallets } from "@privy-io/react-auth/solana";
import { useState } from "react";

import { base64ToBytes, bytesToBase64 } from "@/lib/base64";
import { authedFetch, errorOf } from "@/lib/client";
import { USDC_DECIMALS } from "@/lib/constants";
import type { Token } from "@/lib/types";

type Quote = { outAmount: string; outputDecimals: number; priceImpactPct: number | null };

const units = (usdc: string) => {
  const n = Number(usdc);
  return Number.isFinite(n) && n > 0 ? String(Math.round(n * 10 ** USDC_DECIMALS)) : null;
};
const human = (raw: string, decimals: number) => (Number(raw) / 10 ** decimals).toLocaleString(undefined, { maximumFractionDigits: 6 });

/**
 * Buy one token with USDC through Jupiter, signed in the buyer's own wallet
 * (their Phantom or Solflare, or the embedded wallet Privy made for an email
 * sign-in). The server builds and checks the order; this only signs it.
 */
export function SwapForm({ symbol, tokens, acknowledged, locked }: {
  symbol: string; tokens: Token[]; acknowledged: boolean; locked: boolean;
}) {
  const { wallets, ready } = useWallets();
  const { signTransaction } = useSignTransaction();
  const [mint, setMint] = useState(tokens[0]?.mint ?? "");
  const [amount, setAmount] = useState("100");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [busy, setBusy] = useState<null | "quote" | "buy">(null);
  const [message, setMessage] = useState<{ kind: "error" | "ok"; text: string; href?: string } | null>(null);
  const token = tokens.find(t => t.mint === mint);
  const wallet = wallets[0];

  async function order(withTaker: boolean) {
    const amt = units(amount);
    if (!amt) throw new Error("Enter an amount in USDC.");
    const res = await authedFetch("/api/swap/order", {
      method: "POST",
      body: JSON.stringify({ symbol, mint, amount: amt, acknowledged, ...(withTaker ? { taker: wallet?.address } : {}) }),
    });
    if (!res.ok) throw new Error(await errorOf(res, "Couldn't build this order."));
    return res.json();
  }

  async function getQuote() {
    setBusy("quote"); setMessage(null);
    try { setQuote(await order(false)); } catch (e) { setMessage({ kind: "error", text: (e as Error).message }); }
    setBusy(null);
  }

  async function buy() {
    if (!wallet) return setMessage({ kind: "error", text: "No Solana wallet is connected." });
    setBusy("buy"); setMessage(null);
    try {
      const o = await order(true);
      const { signedTransaction } = await signTransaction({ transaction: base64ToBytes(o.transaction), wallet });
      const res = await authedFetch("/api/swap/execute", {
        method: "POST",
        body: JSON.stringify({ signedTransaction: bytesToBase64(signedTransaction), requestId: o.requestId, orderToken: o.orderToken }),
      });
      if (!res.ok) throw new Error(await errorOf(res, "The swap couldn't be sent."));
      const r = await res.json();
      if (r.status !== "Success") throw new Error(r.message ?? "The swap failed.");
      setMessage({ kind: "ok", text: `Bought ${token?.token_symbol}.`, href: `https://solscan.io/tx/${r.signature}` });
    } catch (e) {
      setMessage({ kind: "error", text: (e as Error).message });
    }
    setBusy(null);
  }

  return (
    <div className="flex flex-col gap-2.5">
      <label htmlFor="swap-token" className="text-sm">Version</label>
      <select id="swap-token" value={mint} onChange={e => { setMint(e.target.value); setQuote(null); }} className="min-h-11 rounded-field border-[1.5px] border-field bg-wash px-3">
        {tokens.map(t => <option key={t.mint} value={t.mint}>{t.token_symbol}</option>)}
      </select>
      <label htmlFor="swap-amount" className="text-sm">Amount (USDC)</label>
      <input id="swap-amount" inputMode="decimal" value={amount} onChange={e => { setAmount(e.target.value); setQuote(null); }} className="min-h-12 rounded-field border-[1.5px] border-field bg-wash px-3.5 text-lg" />
      {quote && token && (
        <p className="text-sm">
          You get about <strong>{human(quote.outAmount, quote.outputDecimals)} {token.token_symbol}</strong>
          {quote.priceImpactPct !== null && <span className="text-muted"> · price impact {Math.abs(quote.priceImpactPct).toFixed(2)}%</span>}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={getQuote} disabled={!!busy} className="min-h-12 flex-1 rounded-full border-[1.5px] border-field bg-surface px-4 font-semibold disabled:opacity-60">
          {busy === "quote" ? "Pricing…" : "Get price"}
        </button>
        <button type="button" onClick={buy} disabled={locked || !!busy || !ready || !wallet} className="min-h-12 flex-1 rounded-full bg-action px-4 font-semibold text-on-action disabled:cursor-not-allowed disabled:bg-field disabled:text-muted">
          {busy === "buy" ? "Confirm in wallet…" : `Buy ${token?.token_symbol ?? ""}`}
        </button>
      </div>
      <p className="text-[13px] text-muted">
        {locked ? "Locked until you tick the acknowledgement above." : wallet ? `Paying from ${wallet.address.slice(0, 4)}…${wallet.address.slice(-4)}` : "Connecting your wallet…"}
      </p>
      {message && (
        <p role={message.kind === "error" ? "alert" : "status"} className={`text-sm ${message.kind === "error" ? "text-cannot" : "text-can"}`}>
          {message.text} {message.href && <a href={message.href} target="_blank" rel="noreferrer" className="underline">View transaction</a>}
        </p>
      )}
    </div>
  );
}
