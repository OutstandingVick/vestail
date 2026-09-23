import type { Metadata } from "next";
import Link from "next/link";

import { Custody } from "@/components/docs/sections/Custody";
import { Disclosure } from "@/components/docs/sections/Disclosure";
import { Faq } from "@/components/docs/sections/Faq";
import { Findings } from "@/components/docs/sections/Findings";
import { HowItWorks } from "@/components/docs/sections/HowItWorks";
import { Limits } from "@/components/docs/sections/Limits";
import { DocsContents } from "@/components/docs/DocsContents";
import { Overview } from "@/components/docs/sections/Overview";
import { Policies } from "@/components/docs/sections/Policies";
import { Problem } from "@/components/docs/sections/Problem";
import { Registry } from "@/components/docs/sections/Registry";
import { Routing } from "@/components/docs/sections/Routing";
import { Stakes } from "@/components/docs/sections/Stakes";
import { Start } from "@/components/docs/sections/Start";
import { Verdicts } from "@/components/docs/sections/Verdicts";
import { APP_HREF } from "@/components/landing/LandingNav";

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
    <main className="max-w-2xl">
      <p className="text-sm font-bold uppercase tracking-widest text-brand-orange">
        Documentation
      </p>
      <h1 className="mt-3 text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
        The same ticker. Different claims. Different rules about who may hold
        them.
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-white/80">
        Vestail reads every tokenized version of a stock, tells you which ones
        someone in your country may actually hold, and buys only the ones you
        may. This page explains what that means, how the answers are produced,
        and where you can check them yourself.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          href={APP_HREF}
          className="rounded-full bg-brand-orange px-6 py-3 font-bold text-brand-navy transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none"
        >
          Open the app
        </Link>
        <a
          href="#overview"
          className="rounded-full px-5 py-3 font-semibold text-white/80 ring-1 ring-white/20 transition-colors hover:bg-white/10 hover:text-white"
        >
          Start reading
        </a>
      </div>

      <div className="mt-10">
        <DocsContents />
      </div>

      <div className="mt-14 space-y-14">
        <Overview />
        <Problem />
        <Stakes />
        <Verdicts />
        <Disclosure />
        <Routing />
        <HowItWorks />
        <Policies />
        <Registry />
        <Custody />
        <Findings />
        <Faq />
        <Limits />
        <Start />
      </div>
    </main>
  );
}
