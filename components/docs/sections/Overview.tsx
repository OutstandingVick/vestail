import { Card, Lede, P, Section } from "@/components/docs/blocks";
import { Stats } from "@/components/docs/Stats";
import { docsStats } from "@/lib/docs/stats";

export function Overview() {
  const { mostVersions } = docsStats();

  return (
    <Section id="overview">
      <Lede>
        Vestail is a buying app for tokenized stocks that answers one question
        first: <em>which version of this stock are you actually allowed to
        hold?</em>
      </Lede>
      <P>
        You pick your country and a company. Vestail lists every tokenized
        version of that company it knows about, says in one line what each one
        legally is, gives each a verdict for the country you declared, and
        links the issuer&apos;s own document behind it. Then it buys — with
        USDC or SOL, through your own wallet — only a version you may hold.
      </P>
      <Stats />
      <P>
        Most of those tokens share a ticker. {mostVersions.symbol} alone exists
        in {mostVersions.count} versions from {mostVersions.count} different
        issuers. In a wallet they look identical: same name, near enough the
        same price, one row each in a token list. They are not the same thing,
        and the difference is the whole product.
      </P>
      <Card>
        <p className="text-sm font-bold uppercase tracking-widest text-white/50">
          In one sentence
        </p>
        <p className="mt-2 text-lg leading-relaxed text-white">
          Vestail shows you the gate <em>before</em> you buy, instead of
          leaving you to find it when you try to get out.
        </p>
      </Card>
    </Section>
  );
}
