"use client";

import { useWallet } from "@solana/wallet-adapter-react";

import { useUsdcBalance } from "@/hooks/useUsdcBalance";
import { formatUsdc, truncateAddress } from "@/lib/format";

/**
 * Connected-wallet summary: truncated address and USDC balance.
 *
 * Renders nothing at all when no wallet is connected — the header already
 * carries the connect affordance, and an empty card would be a second, weaker
 * call to the same action.
 */
export function WalletCard() {
  const { publicKey } = useWallet();
  const { amount, isLoading, error, refetch } = useUsdcBalance();

  if (!publicKey) return null;

  const address = publicKey.toBase58();

  return (
    <section
      aria-label="Connected wallet"
      className="rounded-lg border border-line bg-surface p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <h2 className="text-xs uppercase tracking-[0.18em] text-dim">
            Wallet
          </h2>
          <p
            className="mt-2 font-mono text-lg text-paper"
            title={address}
          >
            {truncateAddress(address)}
          </p>
        </div>

        <div className="sm:text-right">
          <h2 className="text-xs uppercase tracking-[0.18em] text-dim">
            Buying power
          </h2>

          {isLoading ? (
            <p className="mt-2 text-lg text-dim">Reading…</p>
          ) : error ? (
            <div className="mt-2">
              <p className="text-sm text-restricted">Balance unavailable</p>
              <button
                type="button"
                onClick={refetch}
                className="mt-1 text-xs text-dim underline underline-offset-4 hover:text-paper"
              >
                Retry
              </button>
            </div>
          ) : (
            <p className="mt-2 text-lg text-paper">
              {formatUsdc(amount ?? 0)}{" "}
              <span className="text-sm text-dim">USDC</span>
            </p>
          )}
        </div>
      </div>

      <p className="mt-6 border-t border-line pt-4 text-xs leading-relaxed text-dim">
        Vestail never holds your funds or your securities. Every transaction is
        signed in your own wallet.
      </p>
    </section>
  );
}
