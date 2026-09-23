import Link from "next/link";

import { Out, P, Section } from "@/components/docs/blocks";
import { APP_HREF } from "@/components/landing/LandingNav";

const STEPS = [
  "Say where you are. Self-declared, one click, nothing verified.",
  "Pick a company. Every tokenized version of it appears, with a verdict each.",
  "Read the version you were about to buy — what it legally is, and what you will not be able to do with it.",
  "Buy the one you may hold, with USDC or SOL, signed in your own wallet.",
];

export function Start() {
  return (
    <Section id="start">
      <ol className="space-y-3">
        {STEPS.map((step, i) => (
          <li key={step} className="flex gap-4">
            <span
              aria-hidden
              className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white"
            >
              {i + 1}
            </span>
            <span className="leading-relaxed text-white/80">{step}</span>
          </li>
        ))}
      </ol>

      <div className="rounded-2xl bg-brand-navy/70 p-6 ring-1 ring-white/10">
        <p className="text-xl font-bold leading-snug text-white">
          You are going to buy one of these tokens anyway. The only question is
          whether you find out what it is before or after.
        </p>
        <Link
          href={APP_HREF}
          className="mt-5 inline-block rounded-full bg-brand-orange px-6 py-3 font-bold text-brand-navy transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none"
        >
          Find your stock
        </Link>
        <p className="mt-4 text-sm text-white/50">
          Vestail never holds your funds. You sign every transaction. Not
          investment advice.
        </p>
      </div>

      <P>
        Everything on this page is checkable:{" "}
        <Out href="https://github.com/OutstandingVick/vestail">
          the whole thing is public
        </Out>{" "}
        — the policy files, the registry, the evaluator and the tests that pin
        its answers.
      </P>
    </Section>
  );
}
