"use client";

import { useCallback, useEffect, useState } from "react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

import { USDC_MINT } from "@/lib/constants";

/** Fired after a swap lands, so every balance on the page refetches. */
const BALANCES_CHANGED = "vestail:balances-changed";

export function notifyBalancesChanged() {
  window.dispatchEvent(new Event(BALANCES_CHANGED));
}

export interface WalletBalances {
  /** Whole USDC; null when no wallet is connected or the read failed. */
  usdc: number | null;
  /** Whole SOL (native, not wrapped); null likewise. */
  sol: number | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * The connected wallet's USDC and SOL, read together from mainnet.
 *
 * A wallet that has never held USDC has no token account for it: that is a
 * zero balance, not an error. `getParsedTokenAccountsByOwner` returns an
 * empty list for it, which sums to zero.
 */
export function useWalletBalances(): WalletBalances {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [usdc, setUsdc] = useState<number | null>(null);
  const [sol, setSol] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const refetch = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    window.addEventListener(BALANCES_CHANGED, refetch);
    return () => window.removeEventListener(BALANCES_CHANGED, refetch);
  }, [refetch]);

  useEffect(() => {
    if (!publicKey) {
      setUsdc(null);
      setSol(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    // A slow read for a previous wallet must not overwrite the current one.
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([
      connection.getParsedTokenAccountsByOwner(publicKey, { mint: USDC_MINT }),
      connection.getBalance(publicKey),
    ])
      .then(([tokenAccounts, lamports]) => {
        if (cancelled) return;
        setUsdc(
          tokenAccounts.value.reduce(
            (sum, { account }) =>
              sum + ((account.data.parsed.info.tokenAmount.uiAmount as number | null) ?? 0),
            0,
          ),
        );
        setSol(lamports / LAMPORTS_PER_SOL);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setUsdc(null);
        setSol(null);
        setError(cause instanceof Error ? cause.message : "Could not read balances.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [connection, publicKey, nonce]);

  return { usdc, sol, isLoading, error, refetch };
}
