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

      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-20">
        <h1 className="max-w-3xl font-display text-4xl leading-[1.15] tracking-tight text-paper sm:text-5xl">
          Which version of this stock are you actually allowed to hold?
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
      </main>
    </>
  );
}
