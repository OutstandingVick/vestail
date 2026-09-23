import { Card, Lede, P, Section } from "@/components/docs/blocks";
import { docsStats } from "@/lib/docs/stats";

export function Stakes() {
  const { freezable, mints } = docsStats();

  return (
    <Section id="stakes">
      <Lede>
        The gate is never at the entrance. It is at the exit, and you meet it
        on the day you need it.
      </Lede>
      <P>
        Buying a tokenized stock is easy on purpose — anyone can swap into one
        on the open market in a few seconds. The conditions live somewhere
        else: in the issuer&apos;s terms, attached to redemption, dividends,
        or transfer. So the token sits in your wallet for months looking
        exactly like the one anyone else holds, and the difference surfaces at
        the worst possible moment: when you try to redeem it, when a dividend
        is paid, or when you want to move it somewhere that will not accept
        it.
      </P>

      <Card>
        <p className="text-sm font-bold uppercase tracking-widest text-white/50">
          What that looks like in practice
        </p>
        <ul className="mt-3 space-y-3 text-white/80">
          <li className="flex gap-3">
            <span aria-hidden className="text-brand-orange">→</span>
            <span>
              You hold a token whose issuer only redeems for professional
              investors. You can sell it to someone else, but you cannot take
              it back to the issuer at the value it represents.
            </span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden className="text-brand-orange">→</span>
            <span>
              You hold a note rather than a share. The price tracked the stock
              the whole time; your claim was always against the issuer.
            </span>
          </li>
          <li className="flex gap-3">
            <span aria-hidden className="text-brand-orange">→</span>
            <span>
              You are in a country the issuer&apos;s own terms exclude. Nothing
              onchain stopped the purchase, and nothing onchain will help you
              when you try to exercise a right you were never offered.
            </span>
          </li>
        </ul>
      </Card>

      <P>
        And these tokens are not inert. All {freezable} of the {mints} mints
        Vestail tracks have an onchain freeze authority set, which means the
        issuer retains the technical ability to freeze the token in your
        wallet. That is a normal feature of regulated asset tokens, not a
        scandal — but it is a fact about what you are holding, and you should
        learn it before you hold it rather than after.
      </P>
      <P>
        Vestail exists because all of this is knowable in advance. It is
        written down, publicly, by the issuers themselves. It is just never in
        front of you at the moment you decide.
      </P>
    </Section>
  );
}
