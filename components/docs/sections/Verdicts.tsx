import { Lede, Note, P, Section } from "@/components/docs/blocks";
import { VerdictLegend } from "@/components/docs/VerdictLegend";

export function Verdicts() {
  return (
    <Section id="verdicts">
      <Lede>
        Every version of every stock gets one of three verdicts for the
        country you declare. The middle one is the reason Vestail exists.
      </Lede>
      <VerdictLegend />
      <P>
        A two-state model — allowed or not allowed — has to lie about the
        large middle. Most tokenized stocks are freely tradable on the
        secondary market and gated at redemption. Called{" "}
        <span className="font-semibold text-eligible">eligible</span>, that
        hides a gate the holder will certainly meet. Called{" "}
        <span className="font-semibold text-restricted">restricted</span>, it
        asserts a prohibition that does not exist. Neither is true, and users
        get hurt in the gap.
      </P>
      <Note title="Why the middle state is the product">
        <p>
          <span className="font-semibold text-conditional">Conditional</span>{" "}
          is not a softer &ldquo;yes&rdquo; or a gentler &ldquo;no&rdquo;. It
          is its own answer: <em>you may hold this, and here is the specific
          thing you will not be able to do.</em> Vestail names that thing, in
          the issuer&apos;s own words, before you buy.
        </p>
      </Note>
      <P>
        There is a fourth state on screen,{" "}
        <span className="font-semibold text-white">not assessed</span>, and it
        means exactly what it says: no researched rule covers that issuer in
        that country yet. Vestail will not buy one of those either. Missing
        research is not permission.
      </P>
    </Section>
  );
}
