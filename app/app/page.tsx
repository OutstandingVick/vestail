import type { Metadata } from "next";

import { SwapCard } from "@/components/app/SwapCard";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = {
  title: "Check eligibility — Vestail",
};

/**
 * The app: one centred card. Where you are, which stock, what you pay and
 * get, and every version of that stock with its verdict. The marketing
 * landing page is at /.
 */
export default function AppPage() {
  return (
    <>
      <SiteHeader />

      <main className="flex-1 px-3 pb-16 pt-4 sm:px-6 sm:pt-8">
        <h1 className="mx-auto mb-6 max-w-[480px] text-center text-2xl font-bold leading-tight text-white sm:text-3xl">
          Find the version of this stock you&rsquo;re actually allowed to hold
        </h1>

        <SwapCard />

        <p className="mx-auto mt-6 max-w-[480px] text-center text-xs leading-relaxed text-white/75">
          Vestail never holds your funds. You sign every transaction. Not investment advice.
        </p>
      </main>
    </>
  );
}
