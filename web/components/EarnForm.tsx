"use client";

import { useSignTransaction, useWallets } from "@privy-io/react-auth/solana";
import { VersionedTransaction } from "@solana/web3.js";
import { useState } from "react";

import { base64ToBytes, bytesToBase64 } from "@/lib/base64";
import { authedFetch, errorOf } from "@/lib/client";
import { inspectSwapTransaction, LIQUIDITY_PROGRAMS } from "@/lib/swap/inspect";
import type { UtilitiesVersion, UtilityOption } from "@/lib/types";

const usd = (n: number | null) => (n == null ? "—" : n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }));

/**
 * Add liquidity to a Meteora pool from the user's own wallet. The server
 * builds and inspects the transaction; it's inspected again here before the
 * wallet opens; the user signs; the server relays. `enabled` already
 * includes the risk acknowledgement (canAct), and the server checks it too.
 */
export function EarnForm({ version, option, enabled }: { version: UtilitiesVersion; option: UtilityOption; enabled: boolean }) {
  const pools = option.live?.pools ?? [];
  const { wallets } = useWallets();
  const { signTransaction } = useSignTransaction();
  const wallet = wallets[0];
  const [pool, setPool] = useState(pools[0]?.address ?? "");
  const [amountToken, setAmountToken] = useState("");
  const [amountQuote, setAmountQuote] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string; href?: string } | null>(null);
  const selected = pools.find(p => p.address === pool);

  if (!pools.length) return <p className="text-sm text-muted">No USDC or SOL pool on Meteora for this token right now.</p>;

  /** Sign and relay each built transaction, checking every one before the wallet opens. */
  async function signAndSend(transactions: string[]) {
    let last = "";
    for (const t of transactions) {
      const bytes = base64ToBytes(t);
      const check = inspectSwapTransaction(VersionedTransaction.deserialize(bytes), {
        taker: wallet!.address, maxLamportsFromTaker: BigInt(100_000_000_000), extraPrograms: LIQUIDITY_PROGRAMS,
      });
      if (!check.ok) throw new Error(`Refused before signing: ${check.reason}`);
      const { signedTransaction } = await signTransaction({ transaction: bytes, wallet: wallet! });
      const res = await authedFetch("/api/earn/send", { method: "POST", body: JSON.stringify({ transaction: bytesToBase64(signedTransaction), wallet: wallet!.address }) });
      if (!res.ok) throw new Error(await errorOf(res, "The network rejected it."));
      last = (await res.json()).signature;
    }
    return last;
  }

  async function add() {
    if (!wallet) return setMessage({ kind: "error", text: "Connect a Solana wallet first (Settings)." });
    setBusy(true); setMessage(null);
    try {
      const res = await authedFetch("/api/earn", { method: "POST", body: JSON.stringify({
        action: "add", symbol: version.asset.symbol, mint: version.asset.id, pool, wallet: wallet.address, amountToken, amountQuote, acknowledged: enabled,
      }) });
      if (!res.ok) throw new Error(await errorOf(res, "Couldn't build the deposit."));
      const sig = await signAndSend((await res.json()).transactions);
      setMessage({ kind: "ok", text: "Liquidity added.", href: `https://solscan.io/tx/${sig}` });
    } catch (e) {
      setMessage({ kind: "error", text: (e as Error).message });
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-col gap-2.5 border-t border-line pt-3">
      <label htmlFor={`pool-${version.asset.id}`} className="text-sm font-semibold">Pool</label>
      <select id={`pool-${version.asset.id}`} value={pool} onChange={e => setPool(e.target.value)} className="min-h-11 rounded-field border-[1.5px] border-field bg-wash px-3">
        {pools.map(p => <option key={p.address} value={p.address}>{p.name} · {p.kind === "dlmm" ? "DLMM" : "DAMM v2"} · {usd(p.tvlUsd)} deep</option>)}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-sm">{version.asset.tokenSymbol}
          <input inputMode="decimal" value={amountToken} onChange={e => setAmountToken(e.target.value)} placeholder="0" className="min-h-11 rounded-field border-[1.5px] border-field bg-wash px-3" />
        </label>
        <label className="flex flex-col gap-1 text-sm">{selected?.pair ?? "USDC"}
          <input inputMode="decimal" value={amountQuote} onChange={e => setAmountQuote(e.target.value)} placeholder="0" className="min-h-11 rounded-field border-[1.5px] border-field bg-wash px-3" />
        </label>
      </div>
      <p className="text-xs text-muted">{selected?.kind === "dlmm" ? "A Spot position ten price bins either side of today's price." : "A full-range position."} You can fund one side or both.</p>
      <button type="button" onClick={add} disabled={!enabled || busy || !(Number(amountToken) || Number(amountQuote))}
        className="inline-flex min-h-11 w-fit items-center rounded-full bg-action px-5 font-semibold text-on-action disabled:cursor-not-allowed disabled:bg-field disabled:text-muted">
        {busy ? "Confirm in wallet…" : "Add liquidity"}
      </button>
      {message && <p role={message.kind === "error" ? "alert" : "status"} className={`text-sm ${message.kind === "error" ? "text-cannot" : "text-can"}`}>
        {message.text} {message.href && <a href={message.href} target="_blank" rel="noopener noreferrer" className="underline">View transaction</a>}
      </p>}
    </div>
  );
}
