"use client";

import { useEffect, useState } from "react";
import { VersionedTransaction } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";

import { WalletButton } from "@/components/WalletButton";
import { notifyBalancesChanged, useUsdcBalance } from "@/hooks/useUsdcBalance";
import { fromBaseUnits, toBaseUnits } from "@/lib/amounts";
import { base64ToBytes, bytesToBase64 } from "@/lib/base64";
import { REGION_NAME, USDC_DECIMALS, type AllowedRegion } from "@/lib/constants";
import { formatUsdc } from "@/lib/format";
import {
  SwapErrorSchema,
  SwapQuoteSchema,
  SwapResultSchema,
  type RegistryRepresentation,
  type SwapQuote,
  type SwapResult,
} from "@/lib/types";

/**
 * Buy an eligible representation with USDC via Jupiter.
 *
 * Rendered only under rows whose verdict is `eligible`; the order route
 * enforces the same rule on the server. Non-custodial end to end: Vestail
 * builds nothing but the request, the wallet signs, and Jupiter lands it.
 */

/** Past this, the quote may no longer be executable; ask for a fresh one. */
const QUOTE_TTL_MS = 30_000;
/** Above this, say so plainly before the user signs. */
const HIGH_IMPACT_PCT = 3;
const MIN_USDC = 1;

type Phase =
  | { kind: "idle" }
  | { kind: "quoting" }
  | { kind: "quoted"; quote: SwapQuote; at: number }
  | { kind: "signing"; quote: SwapQuote }
  | { kind: "executing"; quote: SwapQuote }
  | { kind: "done"; quote: SwapQuote; result: SwapResult }
  | { kind: "error"; message: string };

export function BuyPanel({
  representation: r,
  region,
}: {
  representation: RegistryRepresentation;
  region: AllowedRegion;
}) {
  const { publicKey, signTransaction } = useWallet();
  const { amount: usdcBalance } = useUsdcBalance();
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [now, setNow] = useState(() => Date.now());

  // Tick only while a quote is on screen, so staleness is visible.
  useEffect(() => {
    if (phase.kind !== "quoted") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [phase.kind]);

  if (!publicKey) {
    return (
      <Shell tokenSymbol={r.tokenSymbol} region={region}>
        <div className="flex flex-wrap items-center gap-3">
          <WalletButton />
          <span className="text-xs text-dim">Connect a wallet to buy.</span>
        </div>
      </Shell>
    );
  }

  const busy =
    phase.kind === "quoting" ||
    phase.kind === "signing" ||
    phase.kind === "executing";

  async function getQuote() {
    const units = toBaseUnits(input, USDC_DECIMALS);
    if (units === null) {
      setPhase({ kind: "error", message: "Enter an amount in USDC, e.g. 5 or 12.50." });
      return;
    }
    if (units < toBaseUnits(String(MIN_USDC), USDC_DECIMALS)!) {
      setPhase({ kind: "error", message: `The minimum is ${MIN_USDC} USDC.` });
      return;
    }
    if (usdcBalance !== null && units > toBaseUnits(String(usdcBalance), USDC_DECIMALS)!) {
      setPhase({
        kind: "error",
        message: `That is more than your ${formatUsdc(usdcBalance)} USDC.`,
      });
      return;
    }

    setPhase({ kind: "quoting" });
    try {
      const params = new URLSearchParams({
        outputMint: r.mint,
        amount: units.toString(),
        taker: publicKey!.toBase58(),
        region,
      });
      const res = await fetch(`/api/swap/order?${params}`);
      const body: unknown = await res.json();
      if (!res.ok) {
        const err = SwapErrorSchema.safeParse(body);
        throw new Error(err.success ? err.data.error : `Quote failed (${res.status}).`);
      }
      setPhase({ kind: "quoted", quote: SwapQuoteSchema.parse(body), at: Date.now() });
      setNow(Date.now());
    } catch (cause) {
      setPhase({
        kind: "error",
        message: cause instanceof Error ? cause.message : "Could not get a quote.",
      });
    }
  }

  async function confirm(quote: SwapQuote) {
    if (!signTransaction) {
      setPhase({ kind: "error", message: "This wallet cannot sign transactions here." });
      return;
    }

    let signedB64: string;
    try {
      const tx = VersionedTransaction.deserialize(base64ToBytes(quote.transaction));

      // Refuse to put a transaction in front of the wallet that this wallet
      // is not a required signer of. The wallet would show it anyway; this
      // catches a mismatched order before the user has to read one.
      const signers = tx.message.staticAccountKeys
        .slice(0, tx.message.header.numRequiredSignatures)
        .map((k) => k.toBase58());
      if (!signers.includes(publicKey!.toBase58())) {
        throw new Error("This transaction is not for your wallet. Get a new quote.");
      }

      setPhase({ kind: "signing", quote });
      const signed = await signTransaction(tx);
      signedB64 = bytesToBase64(signed.serialize());
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      setPhase({
        kind: "error",
        message: /reject|cancel|denied|declined/i.test(message)
          ? "You cancelled in your wallet. Nothing was sent."
          : message,
      });
      return;
    }

    setPhase({ kind: "executing", quote });
    try {
      const res = await fetch("/api/swap/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signedTransaction: signedB64,
          requestId: quote.requestId,
          orderToken: quote.orderToken,
        }),
      });
      const body: unknown = await res.json();
      if (!res.ok) {
        const err = SwapErrorSchema.safeParse(body);
        throw new Error(err.success ? err.data.error : `Execute failed (${res.status}).`);
      }
      const result = SwapResultSchema.parse(body);
      setPhase({ kind: "done", quote, result });
      if (result.status === "Success") notifyBalancesChanged();
    } catch (cause) {
      setPhase({
        kind: "error",
        message:
          cause instanceof Error
            ? `${cause.message} Check your wallet's history before retrying.`
            : "The swap could not be confirmed. Check your wallet's history before retrying.",
      });
    }
  }

  const stale = phase.kind === "quoted" && now - phase.at > QUOTE_TTL_MS;

  return (
    <Shell tokenSymbol={r.tokenSymbol} region={region}>
      <div className="flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="mb-1 block text-xs text-dim">Amount (USDC)</span>
          <input
            inputMode="decimal"
            autoComplete="off"
            placeholder="5.00"
            value={input}
            disabled={busy}
            onChange={(e) => {
              setInput(e.target.value);
              if (phase.kind !== "idle") setPhase({ kind: "idle" });
            }}
            className="w-36 rounded-md border border-line bg-ink px-3 py-2 font-mono text-sm text-paper outline-none placeholder:text-dim/60 focus:border-gold disabled:opacity-60"
          />
        </label>

        {(phase.kind === "idle" || phase.kind === "error" || stale) && (
          <button
            type="button"
            onClick={getQuote}
            disabled={!input}
            className="rounded-md border border-gold px-4 py-2 text-sm text-paper transition-colors hover:bg-gold hover:text-ink disabled:cursor-not-allowed disabled:border-line disabled:text-dim disabled:hover:bg-transparent"
          >
            {stale ? "Refresh quote" : "Get quote"}
          </button>
        )}

        {usdcBalance !== null && (
          <span className="pb-2 text-xs text-dim">
            Balance {formatUsdc(usdcBalance)} USDC
          </span>
        )}
      </div>

      {phase.kind === "quoting" && (
        <p className="mt-3 text-sm text-dim" role="status">
          Asking Jupiter for the best route…
        </p>
      )}

      {phase.kind === "error" && (
        <p className="mt-3 text-sm text-paper" role="alert">
          {phase.message}
        </p>
      )}

      {(phase.kind === "quoted" ||
        phase.kind === "signing" ||
        phase.kind === "executing") && (
        <div className="mt-4">
          <QuoteDetails quote={phase.quote} tokenSymbol={r.tokenSymbol} />
          {phase.kind === "quoted" && !stale && (
            <button
              type="button"
              onClick={() => confirm(phase.quote)}
              className="mt-4 rounded-md bg-gold px-4 py-2 text-sm font-medium text-ink transition-opacity hover:opacity-90"
            >
              Review and sign in wallet
            </button>
          )}
          {stale && (
            <p className="mt-3 text-xs text-dim">
              This quote is over 30 seconds old. Refresh it before signing.
            </p>
          )}
          {phase.kind === "signing" && (
            <p className="mt-3 text-sm text-dim" role="status">
              Waiting for your wallet…
            </p>
          )}
          {phase.kind === "executing" && (
            <p className="mt-3 text-sm text-dim" role="status">
              Sending through Jupiter and waiting for confirmation…
            </p>
          )}
        </div>
      )}

      {phase.kind === "done" && (
        <Outcome
          result={phase.result}
          quote={phase.quote}
          tokenSymbol={r.tokenSymbol}
        />
      )}
    </Shell>
  );
}

function Shell({
  tokenSymbol,
  region,
  children,
}: {
  tokenSymbol: string;
  region: AllowedRegion;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-line bg-surface p-4">
      <p className="text-sm text-paper">Buy {tokenSymbol} with USDC</p>
      <p className="mt-1 text-xs leading-relaxed text-dim">
        Eligible in {REGION_NAME[region]}, so Vestail will route this purchase
        through Jupiter. You sign in your own wallet; Vestail never holds your
        funds or the tokens.
      </p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function QuoteDetails({
  quote,
  tokenSymbol,
}: {
  quote: SwapQuote;
  tokenSymbol: string;
}) {
  const rows: Array<[string, string]> = [
    ["You pay", `${fromBaseUnits(quote.inAmount, USDC_DECIMALS)} USDC`],
    [
      "You receive (estimate)",
      `${fromBaseUnits(quote.outAmount, quote.outputDecimals)} ${tokenSymbol}`,
    ],
  ];
  if (quote.priceImpactPct !== null) {
    rows.push(["Price impact", `${quote.priceImpactPct.toFixed(2)}%`]);
  }
  if (quote.feeBps !== null) {
    rows.push(["Jupiter fee", `${(quote.feeBps / 100).toFixed(2)}%`]);
  }
  if (quote.slippageBps !== null) {
    rows.push(["Slippage limit", `${(quote.slippageBps / 100).toFixed(2)}%`]);
  }
  if (quote.takerLamports > 0) {
    rows.push([
      "SOL for fees",
      `${(quote.takerLamports / 1e9).toFixed(4)} SOL, incl. one-time account rent`,
    ]);
  } else if (quote.gasless) {
    rows.push(["SOL for fees", "None: Jupiter pays network fees (gasless)"]);
  }
  if (quote.router) rows.push(["Route", quote.router]);

  const highImpact =
    quote.priceImpactPct !== null && Math.abs(quote.priceImpactPct) > HIGH_IMPACT_PCT;

  return (
    <div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-dim">{k}</dt>
            <dd className="text-right font-mono text-paper tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      {highImpact && (
        <p className="mt-2 text-xs text-gold">
          Price impact is above {HIGH_IMPACT_PCT}%: the pool is thin for this
          size. A smaller amount will usually get a better price.
        </p>
      )}
    </div>
  );
}

function Outcome({
  result,
  quote,
  tokenSymbol,
}: {
  result: SwapResult;
  quote: SwapQuote;
  tokenSymbol: string;
}) {
  const link = result.signature ? (
    <a
      href={`https://solscan.io/tx/${result.signature}`}
      target="_blank"
      rel="noreferrer"
      className="text-xs text-dim underline underline-offset-4 hover:text-paper"
    >
      View transaction
    </a>
  ) : null;

  if (result.status === "Success") {
    const received = result.totalOutputAmount ?? quote.outAmount;
    return (
      <div className="mt-4" role="status">
        <p className="text-sm text-paper">
          Bought {fromBaseUnits(received, quote.outputDecimals)} {tokenSymbol}.
        </p>
        <div className="mt-1">{link}</div>
      </div>
    );
  }

  return (
    <div className="mt-4" role="alert">
      <p className="text-sm text-paper">{result.message ?? "The swap failed."}</p>
      <div className="mt-1">{link}</div>
    </div>
  );
}
