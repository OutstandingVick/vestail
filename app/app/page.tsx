import type { Metadata } from "next";

import { RepresentationExplorer } from "@/components/RepresentationExplorer";
import { SiteHeader } from "@/components/SiteHeader";
import { WalletCard } from "@/components/WalletCard";

export const metadata: Metadata = {
  title: "Check eligibility — Vestail",
};

/**
 * The app: every tokenized version of a ticker side by side, with a verdict
 * for the declared jurisdiction and a buy path for eligible ones only.
 *
 * Lives at /app; the marketing landing page is at /.
 */
export default function AppPage() {
  return (
    <>
      <SiteHeader />

      <main className="mx-auto w-full max-w-5xl flex-1 px-3 py-8 sm:px-6 sm:py-14">
        {/*
          The app's type and verdict colours were designed for a dark ground.
          Over the site gradient's violet end, secondary text measured about
          1.9:1. This navy panel keeps the gradient framing the page while
          every line of the app sits on an even, dark background.
        */}
        <div className="rounded-2xl bg-ink/85 px-5 py-10 ring-1 ring-white/10 backdrop-blur-sm sm:px-10 sm:py-14">
          <h1 className="max-w-3xl font-display text-4xl leading-[1.15] tracking-tight text-paper sm:text-5xl">
            Find the version of this stock you’re actually allowed to hold

          </h1>

          <p className="mt-8 max-w-2xl text-base leading-relaxed text-dim">
            A ticker is not one thing onchain. The same symbol exists as several
            different tokens from different issuers — one backed 1:1 by shares in
            custody, one a note that merely tracks the price, one a security
            entitlement held through a licensed broker-dealer. They look identical
            in a wallet. They are different legal claims, with different rules
            about who may hold them.
          </p>

          <p className="mt-4 max-w-2xl text-base leading-relaxed text-dim">
            Vestail resolves every tokenized representation of a security, shows
            which ones you may hold where you are, and routes a purchase only to
            the eligible ones.
          </p>

          <div className="mt-16">
            <RepresentationExplorer />
          </div>

          {/* Renders only once a wallet is connected. */}
          <div className="mt-14">
            <WalletCard />
          </div>

          <p className="mt-14 max-w-2xl border-l-2 border-gold pl-4 text-sm leading-relaxed text-dim">
            Vestail is a disclosure tool, not a compliance gate. Jurisdiction is
            self-declared and nothing here is blocked or enforced. This is not
            legal, investment or tax advice.
          </p>
        </div>
      </main>
    </>
  );
}
