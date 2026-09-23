"use client";

import { useCallback, useState } from "react";
import { VersionedTransaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

import { notifyBalancesChanged } from "@/hooks/useWalletBalances";
import { base64ToBytes, bytesToBase64 } from "@/lib/base64";
import { WSOL_MINT, type AllowedRegion } from "@/lib/constants";
import { inspectSwapTransaction, maxLamportsFor } from "@/lib/swap/inspect";
import {
  SwapErrorSchema,
  SwapQuoteSchema,
  SwapResultSchema,
  type SwapQuote,
  type SwapResult,
} from "@/lib/types";

export type BuyPhase =
  | { kind: "idle" }
  | { kind: "ordering" }
  /*
   * From here on the phase carries the order itself. The amount on screen
   * until now came from an estimate fetched without a wallet; this is the
   * quote actually being signed, and it is not always the same number. The
   * page should show what is in the wallet, not what was on screen a moment
   * before it opened.
   */
  | { kind: "signing"; quote: SwapQuote }
  | { kind: "executing"; quote: SwapQuote }
  | { kind: "done"; result: SwapResult }
  | { kind: "error"; message: string };

export interface BuyRequest {
  inputMint: string;
  outputMint: string;
  amount: bigint;
  region: AllowedRegion;
  /** The buyer ticked the version's acknowledgement (conditional versions). */
  acknowledged: boolean;
}

/**
 * Buy a version: fresh order -> the user's wallet signs -> Jupiter lands it
 * through /api/swap/execute. Non-custodial throughout: Vestail never holds a
 * key or the funds, and the wallet shows the transaction before signing.
 *
 * The order is fetched at the moment of buying, with the wallet as taker,
 * rather than reusing the on-screen estimate: an estimate has no
 * transaction, and a quote goes stale within seconds anyway.
 */
export function useBuy() {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const [phase, setPhase] = useState<BuyPhase>({ kind: "idle" });

  const reset = useCallback(() => setPhase({ kind: "idle" }), []);

  const buy = useCallback(
    async (req: BuyRequest) => {
      if (!publicKey || !signTransaction) {
        setPhase({ kind: "error", message: "Connect a wallet that can sign transactions." });
        return;
      }

      // 1. A buildable order, for this wallet.
      setPhase({ kind: "ordering" });
      let quote: SwapQuote;
      try {
        const query = new URLSearchParams({
          inputMint: req.inputMint,
          outputMint: req.outputMint,
          amount: req.amount.toString(),
          taker: publicKey.toBase58(),
          region: req.region,
          acknowledged: String(req.acknowledged),
        });
        const res = await fetch(`/api/swap/order?${query}`);
        const body: unknown = await res.json();
        if (!res.ok) {
          const err = SwapErrorSchema.safeParse(body);
          throw new Error(err.success ? err.data.error : `Could not build the order (${res.status}).`);
        }
        quote = SwapQuoteSchema.parse(body);
        if (quote.quoteOnly || !quote.transaction || !quote.orderToken || !quote.requestId) {
          throw new Error("The order came back without a transaction. Try again.");
        }
      } catch (cause) {
        setPhase({ kind: "error", message: cause instanceof Error ? cause.message : "Could not build the order." });
        return;
      }

      // 2. Read the transaction before asking anyone to sign it.
      let signed: string;
      try {
        const tx = VersionedTransaction.deserialize(base64ToBytes(quote.transaction));
        /*
         * What Jupiter sent back is untrusted input, and this is the last
         * point at which anything can be done about it: after this line the
         * user's wallet is open and a signature is one click away. The
         * server checked it too, but a check that only runs there protects
         * nobody if the server is the thing that has been compromised.
         */
        const inspection = inspectSwapTransaction(tx, {
          taker: publicKey.toBase58(),
          maxLamportsFromTaker: maxLamportsFor(
            req.inputMint,
            req.amount,
            WSOL_MINT.toBase58(),
          ),
        });
        if (!inspection.ok) {
          throw new Error(`${inspection.reason} Nothing was signed.`);
        }

        /*
         * Simulate before the wallet opens. A transaction that will fail on
         * chain still costs the fee, and the failure is the signal that
         * something about this order is wrong — a stale blockhash, a route
         * that no longer exists. Better to learn that from the RPC than to
         * spend the user's money finding out.
         *
         * sigVerify is off because nothing is signed yet, and the blockhash
         * is replaced because the one in the order may already be a few
         * slots old.
         */
        const simulation = await connection.simulateTransaction(tx, {
          sigVerify: false,
          replaceRecentBlockhash: true,
          commitment: "processed",
        });
        if (simulation.value.err) {
          throw new Error(
            "This swap would fail on chain, so it was not sent to your wallet. Try again, or try a smaller amount.",
          );
        }

        setPhase({ kind: "signing", quote });
        signed = bytesToBase64((await signTransaction(tx)).serialize());
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

      // 3. Land it.
      setPhase({ kind: "executing", quote });
      try {
        const res = await fetch("/api/swap/execute", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            signedTransaction: signed,
            requestId: quote.requestId,
            orderToken: quote.orderToken,
          }),
        });
        const body: unknown = await res.json();
        if (!res.ok) {
          const err = SwapErrorSchema.safeParse(body);
          throw new Error(err.success ? err.data.error : `The swap could not be sent (${res.status}).`);
        }
        const result = SwapResultSchema.parse(body);
        setPhase({ kind: "done", result });
        if (result.status === "Success") notifyBalancesChanged();
      } catch (cause) {
        setPhase({
          kind: "error",
          message: `${cause instanceof Error ? cause.message : "The swap could not be confirmed."} Check your wallet's history before trying again.`,
        });
      }
    },
    [connection, publicKey, signTransaction],
  );

  return { phase, buy, reset };
}
