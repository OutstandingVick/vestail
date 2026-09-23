import { Lede, P, Section } from "@/components/docs/blocks";

const STEPS: Array<{ title: string; body: string }> = [
  {
    title: "Resolve",
    body: "Find every token that claims to represent the company you asked for — and prove each one really is the issuer's, rather than something with the same ticker.",
  },
  {
    title: "Evaluate",
    body: "Run each token's issuer policy against the country you declared. The most severe rule that applies decides the verdict; every rule that applied is kept as evidence, with its source.",
  },
  {
    title: "Route",
    body: "Price and place the order through Jupiter for a version you may hold, re-checking the verdict on the server first. Your wallet signs; the tokens land in it.",
  },
];

export function HowItWorks() {
  return (
    <Section id="how-it-works">
      <Lede>Three steps, in this order, every time.</Lede>
      <ol className="space-y-3">
        {STEPS.map((step, i) => (
          <li
            key={step.title}
            className="flex gap-4 rounded-2xl bg-brand-navy/60 p-5 ring-1 ring-white/10"
          >
            <span
              aria-hidden
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-orange text-sm font-bold text-brand-navy"
            >
              {i + 1}
            </span>
            <div>
              <p className="font-bold text-white">{step.title}</p>
              <p className="mt-1 leading-relaxed text-white/70">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <P>
        The first two steps are the research; the third is the part that
        looks like an app. Everything the first two produce is checked into
        git and readable by anyone, which is what the next two sections are
        about.
      </P>
    </Section>
  );
}
