"use client";

import dynamic from "next/dynamic";

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
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  {
    ssr: false,
    loading: () => (
      <div
        aria-hidden
        className="h-[38px] w-[150px] animate-pulse rounded-md border border-line bg-surface"
      />
    ),
  },
);
