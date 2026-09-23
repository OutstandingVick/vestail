import { Lede, Section } from "@/components/docs/blocks";

const QUESTIONS: Array<{ q: string; a: string }> = [
  {
    q: "Do I need to verify my identity?",
    a: "No. Vestail has no KYC, no sign-up and no account. You pick a country from a list; nothing checks it, and nothing about you is collected.",
  },
  {
    q: "Can Vestail stop me buying something?",
    a: "It can decline to buy it for you, and it does for restricted versions. It cannot stop you buying that token elsewhere, and it does not try to. Jurisdiction here is self-declared.",
  },
  {
    q: "Is this legal or investment advice?",
    a: "No. Vestail summarises what issuers say about their own products and links the documents. What that means for you is between you, those documents and your own advisers.",
  },
  {
    q: "What if a verdict is wrong?",
    a: "Every verdict links the source it came from, so a wrong one is checkable rather than a matter of trust. Corrections land as commits against the policy file, with the reason in the message — that has already happened more than once.",
  },
  {
    q: "What can I pay with?",
    a: "USDC or SOL, from your own wallet, on Solana mainnet. You see the estimated amount you will receive before connecting anything.",
  },
  {
    q: "Why does the issuer have a freeze authority on my token?",
    a: "Because regulated asset tokens are usually built that way: the issuer keeps the technical ability to freeze a holding. Vestail does not treat it as disqualifying — it treats it as something you should know before you hold one.",
  },
  {
    q: "Which countries are covered?",
    a: "Nigeria, the United States and Germany today. Each one is a research commitment across every issuer, not a dropdown entry, so the list grows slowly and on purpose.",
  },
  {
    q: "Does Vestail take a cut?",
    a: "You pay the market's own costs for the swap. Vestail holds nothing and settles nothing on your behalf.",
  },
];

export function Faq() {
  return (
    <Section id="faq">
      <Lede>The things people ask before they trust any of this.</Lede>
      <div className="space-y-2">
        {QUESTIONS.map(({ q, a }) => (
          <details
            key={q}
            className="group rounded-2xl bg-brand-navy/60 ring-1 ring-white/10 open:ring-white/20"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange">
              {q}
              <span
                aria-hidden
                className="shrink-0 text-brand-orange transition-transform group-open:rotate-45 motion-reduce:transition-none"
              >
                +
              </span>
            </summary>
            <p className="px-4 pb-4 leading-relaxed text-white/70">{a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
