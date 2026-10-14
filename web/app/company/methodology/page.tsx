import type { Metadata } from "next";

import { LegalPage } from "@/components/LegalPage";
import { absolute } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Methodology — where Vestail's rules come from",
  description:
    "How Vestail decides whether you may own an asset: the three verdicts, the sources behind each rule, how freshness is recorded, and what is not yet verified.",
  alternates: { canonical: absolute("/company/methodology") },
  openGraph: {
    title: "Methodology — where Vestail's rules come from",
    description: "The three verdicts, the sources behind each rule, and what is not yet verified.",
    url: absolute("/company/methodology"),
    type: "article",
  },
};

/**
 * The page a careful reader goes looking for before trusting any of this.
 *
 * On a site that tells people what they may legally own, how the answers are
 * produced is not marketing — it is the thing being sold. That includes the
 * part nobody wants to publish: today none of the 480 rules has been checked
 * against a primary document. Saying so here costs less than a reader
 * discovering it themselves.
 */
export default function MethodologyPage() {
  return (
    <LegalPage title="Methodology">
      <section>
        <h2 className="font-bold">The three verdicts</h2>
        <p>
          Every combination of country, asset class and buyer type resolves to one of three answers.
          <strong> Can own</strong> means the rules place no barrier on someone in your position.
          <strong> Conditional</strong> means you can hold it, but something stands between you and
          using or exiting it — a licence, an ownership cap, a regulatory approval, an identity check.
          <strong> Cannot own</strong> means the rules exclude you.
        </p>
        <p>
          The middle verdict is the one that matters most and the one most services collapse. An asset
          you can buy but cannot redeem, collect on or sell is not the same as one you own outright,
          and Vestail will not round it to either neighbour.
        </p>
      </section>

      <section>
        <h2 className="font-bold">Where a rule comes from</h2>
        <p>
          Rules are drawn from primary sources: statutes and regulations, guidance published by the
          relevant regulator, and the issuer&apos;s own terms where an asset is issued rather than
          legislated. Each rule records the documents behind it and the date it was last checked
          against them, and both are meant to be shown beside the verdict rather than kept internally.
        </p>
        <p>
          Secondary sources — news coverage, summaries, another service&apos;s answer — are not
          sufficient on their own. They can point to a document; they cannot stand in for it.
        </p>
      </section>

      <section>
        <h2 className="font-bold">What is not yet verified</h2>
        <p>
          Vestail currently carries 480 rules: 12 countries, 20 asset classes, citizens and foreigners.
          <strong> None of them has yet been checked against a primary document.</strong> They are
          illustrative — they demonstrate the shape of the answer, not the answer itself. Sourcing
          them is the work in progress, and until a rule carries its documents and a verification date,
          it should not be relied on for a real decision.
        </p>
        <p>
          We would rather say this plainly than let the interface imply an authority the data has not
          earned. A compliance answer with no source behind it is a guess wearing a uniform.
        </p>
      </section>

      <section>
        <h2 className="font-bold">Country is declared, never detected</h2>
        <p>
          You tell Vestail where you are buying from, and you can change it at any time. There is no
          KYC, no identity check and no inference from your IP address. Vestail shows what the rules
          say and routes accordingly; it does not police who you are, and it cannot — the declaration
          is yours to make honestly.
        </p>
      </section>

      <section>
        <h2 className="font-bold">What the tokens actually are</h2>
        <p>
          The same listed share exists onchain as several different legal claims, and they are not
          interchangeable. One is backed by shares held in custody and can be redeemed. One is a
          security entitlement through a broker. One is a debt security giving economic exposure to
          the price with no legal or beneficial right to the share at all. Vestail records which is
          which, because the difference only becomes visible at the moment you try to exit.
        </p>
      </section>

      <section>
        <h2 className="font-bold">Corrections</h2>
        <p>
          If a rule is wrong, we want to know, and a cited document beats an argument. Raise it at{" "}
          <a className="underline" href="https://github.com/OutstandingVick/vestail/issues">
            github.com/OutstandingVick/vestail
          </a>
          .
        </p>
      </section>

      <section>
        <h2 className="font-bold">Not legal or financial advice</h2>
        <p>
          Vestail is an information service. Nothing on it is legal, tax or financial advice, and it
          is not a recommendation to buy or sell anything. Rules change, and they apply differently to
          individual circumstances. For a large or unusual purchase, take advice from a professional
          qualified in that country.
        </p>
      </section>
    </LegalPage>
  );
}
