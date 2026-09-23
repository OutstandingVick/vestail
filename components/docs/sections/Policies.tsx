import { CodeBlock } from "@/components/docs/CodeBlock";
import { Lede, Note, Out, P, Section } from "@/components/docs/blocks";
import { POLICIES } from "@/lib/policies";
import { docsStats } from "@/lib/docs/stats";

/** The example rule, taken from the file itself so it cannot go stale. */
function exampleRule(): string {
  const gate = POLICIES.xstocks.rules.find(
    (r) => r.kind === "gate" && r.status === "conditional",
  );
  return JSON.stringify(gate, null, 2);
}

export function Policies() {
  const { rules, primaryRules, regions } = docsStats();

  return (
    <Section id="policies">
      <Lede>
        Every verdict comes from a rule in a file, and every rule carries a
        link to the issuer&apos;s own document.
      </Lede>
      <P>
        There is no database of eligibility here and no model guessing at it.
        There are five JSON files, one per issuer, holding {rules} rules
        across {regions} countries — {primaryRules} of them sourced to a
        primary document the issuer published themselves. The evaluator that
        turns those rules into a verdict is about a hundred lines of pure
        code with no network access, and the tests pin its answers.
      </P>
      <CodeBlock caption="policies/xstocks.json — one rule" code={exampleRule()} />
      <P>
        Four things are worth noticing. The rule names the countries it
        applies to. It states its reason in full, and a short version for the
        screen. It carries the acknowledgement you will be asked to tick,
        which is why that sentence is research rather than copywriting. And
        it says where it came from, plus whether that source is the issuer
        or somebody writing about the issuer.
      </P>
      <Note title="Git is the audit trail">
        <p>
          The files live in the repository, so every change to a rule is a
          commit with a date, a diff and a reason. If Vestail&apos;s answer
          about a token changes, you can see exactly when it changed and what
          it changed from. Corrections are new commits, never quiet edits —
          more than one rule here has already been corrected that way after a
          secondary source turned out to be wrong.
        </p>
      </Note>
      <P>
        You can read all of it:{" "}
        <Out href="https://github.com/OutstandingVick/vestail/tree/main/policies">
          the policy files
        </Out>
        , their{" "}
        <Out href="https://github.com/OutstandingVick/vestail/blob/main/policies/README.md">
          rules of evaluation
        </Out>
        , and the{" "}
        <Out href="https://github.com/OutstandingVick/vestail/blob/main/lib/evaluate.ts">
          evaluator
        </Out>{" "}
        itself.
      </P>
    </Section>
  );
}
