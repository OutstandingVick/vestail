"use client";

import dynamic from "next/dynamic";

/**
 * Our wording for the multi button's states. The library's own
 * WalletMultiButton hard-codes "Select Wallet" before a wallet is picked; the
 * header asks people to connect, so both pre-connection states say so.
 */
const LABELS = {
  "no-wallet": "Connect Wallet",
  "has-wallet": "Connect Wallet",
  connecting: "Connecting…",
  "change-wallet": "Change wallet",
  "copy-address": "Copy address",
  copied: "Copied",
  disconnect: "Disconnect",
} as const;

/**
 * SSR-safe wallet connect button.
 *
 * WalletMultiButton reaches for `window` while mounting — it probes for
 * injected providers to decide what to render. Under the App Router that runs
 * during the server pass, which throws outright or, worse, renders a
 * "no wallet detected" tree on the server that then mismatches the client and
 * produces a hydration error.
 *
 * Loading it through next/dynamic with ssr: false is the fix: the button is
 * only ever evaluated in the browser. The placeholder keeps the header from
 * reflowing when the real button swaps in.
 */
export const WalletButton = dynamic(
  async () => {
    const { BaseWalletMultiButton } = await import("@solana/wallet-adapter-react-ui");
    return function VestailWalletButton() {
      return <BaseWalletMultiButton labels={LABELS} />;
    };
  },
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden
        className="h-10.5 w-37.5 motion-safe:animate-pulse rounded-xl bg-brand-orange/40"
      />
    ),
  },
);
