import { Lede, Note, P, Section } from "@/components/docs/blocks";
import { VerdictGrid } from "@/components/docs/VerdictGrid";
import { docsStats } from "@/lib/docs/stats";

export function Findings() {
  const { mostVersions, regions } = docsStats();

  return (
    <Section id="findings">
      <Lede>
        Researching five issuers across {regions} countries produced one result
        that decided the shape of the product.
      </Lede>
      <P>
        Below is {mostVersions.symbol} — the one symbol every issuer covers —
        judged in every country Vestail supports. Each badge is computed here,
        now, by the evaluator, from the policy files.
      </P>
      <VerdictGrid symbol="SPCX" />
      <Note title="For a retail buyer, almost nothing is simply eligible">
        <p>
          Read down the grid and the pattern is unmistakable: freely tradable
          onchain, gated at the exit. Different issuers, different countries,
          the same shape of answer. This is not an edge case that a warning
          banner could cover — it is the normal condition of tokenized stocks
          today, and it is invisible everywhere except in documents nobody
          reads before buying.
        </p>
      </Note>
      <P>
        That finding is also why a two-state model was never an option here,
        and why the app will buy conditional versions instead of refusing
        them. Refusing would have meant an app that declines to buy almost
        everything while showing you tokens it says are fine to hold.
      </P>
    </Section>
  );
}
