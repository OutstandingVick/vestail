import Link from "next/link";

import { APP_HREF } from "@/components/landing/LandingNav";

/**
 * Landing hero: kicker, headline, subhead and one CTA, centred.
 *
 * The globe sits behind this text on desktop and below it on mobile; see
 * the globe layer, added separately so this copy renders on first paint
 * with or without it.
 */
export function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate overflow-hidden"
    >
      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-4xl flex-col items-center justify-center px-4 pb-16 pt-28 text-center sm:px-8">
        {/*
          Soft navy scrim behind the copy, so it stays readable wherever the
          globe's bright dots and coins pass underneath. Radial and blurred at
          the edge so it reads as depth, not as a box.
        */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[75%] w-[120%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgb(10_18_42/0.7),rgb(10_18_42/0.35)_55%,transparent)] blur-2xl"
        />

        <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold tracking-wide text-white/85 sm:text-sm">
          <span
            aria-hidden
            className="size-1.5 rounded-full bg-brand-orange shadow-[0_0_10px_2px_rgb(255_88_10/0.8)]"
          />
          Where the right stock finds the right owner
        </p>

        <h1
          id="hero-heading"
          className="mt-6 text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl"
        >
          Your gateway to eligible stocks, verified issuers, safe delivery, and
          more
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
          Tokenized stocks exist across providers you&apos;ve never heard of,
          each with different rules about who&apos;s allowed to hold them.
          Vestail resolves the right one for you, and delivers it.
        </p>

        <Link
          href={APP_HREF}
          className="mt-10 rounded-full bg-brand-orange px-8 py-4 text-base font-semibold text-brand-navy shadow-[0_12px_32px_-10px_rgb(255_88_10/0.8)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          Check eligibility
        </Link>
      </div>
    </section>
  );
}
