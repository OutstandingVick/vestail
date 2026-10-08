"use client";

import { useWallets } from "@privy-io/react-auth";
import { useState } from "react";

import { EVM_CHAINS, isEvmChain } from "@/lib/chains";
import { authedFetch, errorOf } from "@/lib/client";
import type { Token } from "@/lib/types";

const toWei = (eth: string) => {
  if (!/^\d*\.?\d*$/.test(eth.trim()) || !Number(eth)) return null;
  const [w, f = ""] = eth.trim().split(".");
  return (BigInt(w || "0") * BigInt(1e18) + BigInt((f + "0".repeat(18)).slice(0, 18))).toString();
};
const human = (raw: string, decimals: number) => (Number(raw) / 10 ** decimals).toLocaleString(undefined, { maximumFractionDigits: 6 });

/**
 * Buy a version on Base or Robinhood Chain with ETH, signed in the buyer's own
 * EVM wallet (embedded or external). The server picks the route, checks the
 * verdict and inspects the transaction; this only switches chain and sends it.
 */
export function EvmSwapForm({ symbol, tokens, acknowledged, locked }: { symbol: string; tokens: Token[]; acknowledged: boolean; locked: boolean }) {
  const { wallets, ready } = useWallets();
  const [address, setAddress] = useState(tokens[0]?.address ?? "");
  const [amount, setAmount] = useState("0.01");
  const [quote, setQuote] = useState<{ amountOut: string; outputDecimals: number; priceImpactPct: number; valueUsd: number } | null>(null);
  const [busy, setBusy] = useState<null | "quote" | "buy">(null);
  const [message, setMessage] = useState<{ kind: "error" | "ok"; text: string; href?: string } | null>(null);
  const token = tokens.find(t => t.address === address);
  const chain = token && isEvmChain(token.chain) ? EVM_CHAINS[token.chain] : null;
  const wallet = wallets.find(w => w.walletClientType === "privy") ?? wallets[0];

  async function order(withTaker: boolean) {
    const amountWei = toWei(amount);
    if (!amountWei) throw new Error("Enter an amount in ETH.");
    const res = await authedFetch("/api/evm/order", {
      method: "POST",
      body: JSON.stringify({ symbol, address, amountWei, acknowledged, ...(withTaker ? { taker: wallet?.address } : {}) }),
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
    if (!wallet || !chain) return setMessage({ kind: "error", text: "No EVM wallet is connected. Create one in Settings." });
    setBusy("buy"); setMessage(null);
    try {
      const o = await order(true);
      await wallet.switchChain(chain.id);
      const provider = await wallet.getEthereumProvider();
      const hash = (await provider.request({
        method: "eth_sendTransaction",
        params: [{ from: wallet.address, to: o.tx.to, data: o.tx.data, value: "0x" + BigInt(o.tx.value).toString(16) }],
      })) as string;
      setMessage({ kind: "ok", text: `Sent. Your ${token?.token_symbol} arrives once it confirms.`, href: `${chain.explorer}/tx/${hash}` });
    } catch (e) {
      setMessage({ kind: "error", text: (e as Error).message });
    }
    setBusy(null);
  }

  return (
    <div className="flex flex-col gap-2.5">
      <label htmlFor={`evm-token-${symbol}`} className="text-sm">Version</label>
      <select id={`evm-token-${symbol}`} value={address} onChange={e => { setAddress(e.target.value); setQuote(null); }} className="min-h-11 rounded-field border-[1.5px] border-field bg-wash px-3">
        {tokens.map(t => <option key={t.address} value={t.address}>{t.token_symbol} · {t.chain_name}</option>)}
      </select>
      <label htmlFor={`evm-amount-${symbol}`} className="text-sm">Amount (ETH on {chain?.name ?? "the token's chain"})</label>
      <input id={`evm-amount-${symbol}`} inputMode="decimal" value={amount} onChange={e => { setAmount(e.target.value); setQuote(null); }} className="min-h-12 rounded-field border-[1.5px] border-field bg-wash px-3.5 text-lg" />
      {quote && token && (
        <p className="text-sm">
          You get about <strong>{human(quote.amountOut, quote.outputDecimals)} {token.token_symbol}</strong>
          <span className="text-muted"> · about ${quote.valueUsd.toFixed(2)} · price impact {quote.priceImpactPct.toFixed(2)}%</span>
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
        {locked ? "Locked until you tick the acknowledgement above." : wallet ? `Paying from ${wallet.address.slice(0, 6)}…${wallet.address.slice(-4)} via KyberSwap` : "No EVM wallet yet: create one in Settings."}
      </p>
      {message && (
        <p role={message.kind === "error" ? "alert" : "status"} className={`text-sm ${message.kind === "error" ? "text-cannot" : "text-can"}`}>
          {message.text} {message.href && <a href={message.href} target="_blank" rel="noreferrer" className="underline">View transaction</a>}
        </p>
      )}
    </div>
  );
}
