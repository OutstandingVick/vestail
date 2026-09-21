"use client";

import { useCallback, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";

import { USDC_MINT } from "@/lib/constants";

const BALANCES_CHANGED = "vestail:balances-changed";

/**
 * Tell every mounted balance reader to refetch, e.g. after a swap lands.
 * Each component owns its own hook instance, so a local refetch would leave
 * the others showing the old balance.
 */
export function notifyBalancesChanged() {
  window.dispatchEvent(new Event(BALANCES_CHANGED));
}

export interface UsdcBalance {
  /** Balance in whole USDC, or null when there is no wallet connected. */
  amount: number | null;
  isLoading: boolean;
  /** Populated only for real RPC failures, never for "no token account". */
  error: string | null;
  refetch: () => void;
}

/**
 * Reads the connected wallet's USDC balance from mainnet.
 *
 * A wallet that has never held USDC simply has no token account for the mint.
 * That is a zero balance, not a failure, and it is the normal state for a new
 * user — surfacing it as an error would put a red state in front of someone
 * whose wallet is merely empty. `getParsedTokenAccountsByOwner` gives us that
 * for free: no account means an empty list, which sums to zero.
 *
 * Summing across accounts rather than reading the associated token account
 * alone also covers wallets holding USDC in a non-ATA account, which is
 * unusual but real.
 */
export function useUsdcBalance(): UsdcBalance {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const [amount, setAmount] = useState<number | null>(null);
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
      setAmount(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Guards against a slow response for a previous wallet landing after the
    // user has switched accounts and overwriting the newer balance.
    let cancelled = false;

    setIsLoading(true);
    setError(null);

    connection
      .getParsedTokenAccountsByOwner(publicKey, { mint: USDC_MINT })
      .then(({ value }) => {
        if (cancelled) return;

        const total = value.reduce(
          (sum, { account }) =>
            sum +
            (account.data.parsed.info.tokenAmount.uiAmount as number | null ??
              0),
          0,
        );

        setAmount(total);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        setAmount(null);
        setError(
          cause instanceof Error
            ? cause.message
            : "Could not read balance from the RPC endpoint.",
        );
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [connection, publicKey, nonce]);

  return { amount, isLoading, error, refetch };
}
