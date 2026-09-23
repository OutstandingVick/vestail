import { Lede, P, Section } from "@/components/docs/blocks";
import { POLICIES } from "@/lib/policies";
import { docsStats } from "@/lib/docs/stats";

/** The oldest review date across the policy files: how fresh the research is. */
function reviewedAt(): string {
  return Object.values(POLICIES)
    .map((p) => p.reviewedAt)
    .sort()[0];
}

export function Limits() {
  const { symbols, regions } = docsStats();

  const LIMITS: Array<{ title: string; body: string }> = [
    {
      title: "It covers a short list, on purpose",
      body: `${symbols} companies and funds across ${regions} countries. Each country is a research pass over every issuer, not a dropdown entry, so the list grows slowly.`,
    },
    {
      title: "It buys; it does not sell yet",
      body: "You can acquire a version you may hold. Selling back out through Vestail is not built, and the interface says so rather than hiding the control.",
    },
    {
      title: "The research is a snapshot",
      body: `Every policy file carries the date it was last reviewed — currently ${reviewedAt()} — and issuers change their terms without telling anyone. The source link is there so you can check today's document, not last quarter's reading of it.`,
    },
    {
      title: "Some claims rest on secondary sources",
      body: "Where a rule could not be confirmed in the issuer's own document, it is marked as secondary and the verdict carries that mark. It is not presented as though it were the issuer's word.",
    },
    {
      title: "It cannot tell you what you are allowed to do",
      body: "It tells you what the issuer says about holders in a country you typed in yourself. Your actual position depends on facts Vestail does not have and should not ask for.",
    },
  ];

  return (
    <Section id="limits">
      <Lede>
        The limits are part of the product, so they belong in the
        documentation rather than in a footnote.
      </Lede>
      <ul className="space-y-px overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10">
        {LIMITS.map((l) => (
          <li key={l.title} className="bg-brand-navy/80 p-4">
            <p className="font-bold text-white">{l.title}</p>
            <p className="mt-1 leading-relaxed text-white/70">{l.body}</p>
          </li>
        ))}
      </ul>
      <P>
        None of this is a reason to skip the check. Partial, sourced, dated
        information about what you are about to buy beats the alternative on
        offer everywhere else, which is a ticker and a price.
      </P>
    </Section>
  );
}
