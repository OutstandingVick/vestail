import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Docs — Vestail",
  description:
    "What Vestail is, why a stock ticker is not one thing onchain, and how Vestail decides which version of a stock you are actually allowed to hold.",
};

/**
 * The documentation page.
 *
 * One long page rather than a set of routes: everything here is a single
 * argument read top to bottom, and a reader who wants one part can link
 * straight to its anchor. Static — it reads the registry and the policy
 * files at build time, never at request time.
 */
export default function DocsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-bold tracking-tight text-white">
        Vestail, documented
      </h1>
    </main>
  );
}
