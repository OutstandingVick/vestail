import { Card, Lede, P, Section } from "@/components/docs/blocks";

const PROMISES: Array<{ title: string; body: string }> = [
  {
    title: "We are not a compliance product",
    body: "Vestail does not certify anyone's eligibility, is not a regulated intermediary, and gives no legal, investment or tax advice.",
  },
  {
    title: "We never hold your money",
    body: "No deposits, no custody, no account. Funds move from your wallet to the market and back; every transaction is signed by you.",
  },
  {
    title: "Every claim is sourced",
    body: "Each rule links the issuer's own document, and that link follows the verdict onto the screen. Check our work against the source, not against our summary of it.",
  },
];

export function Disclosure() {
  return (
    <Section id="disclosure">
      <Lede>
        Vestail does not block anyone, and could not if it wanted to.
      </Lede>
      <P>
        Your country is self-declared. There is no KYC here, no identity
        check, no geofence, no onchain gate. You can declare anything and buy
        anything — the same as you could without us. That is not a gap we
        intend to close: a browser app is not the right place to decide who
        may hold what, and pretending otherwise would be theatre.
      </P>
      <P>
        What Vestail does is make the gate visible <em>before</em> the trade
        instead of leaving you to find it at redemption. The information is
        the product. The restraint is deliberate.
      </P>
      <div className="grid gap-3 sm:grid-cols-3">
        {PROMISES.map((p) => (
          <Card key={p.title} className="!p-4">
            <p className="font-bold text-white">{p.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-white/65">{p.body}</p>
          </Card>
        ))}
      </div>
      <P>
        The honest framing: an invisible gate made visible. Not a permission
        system, and not a promise that you are allowed to do anything.
      </P>
    </Section>
  );
}
