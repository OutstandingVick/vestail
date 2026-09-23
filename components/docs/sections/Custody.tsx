import { Lede, Out, P, Section } from "@/components/docs/blocks";

const FACTS: Array<{ title: string; body: string }> = [
  {
    title: "No account, no deposit",
    body: "You connect a wallet. There is nothing to sign up for and nothing to fund. Vestail has no address that holds your money, because it has no address at all.",
  },
  {
    title: "You sign every transaction",
    body: "The swap is built server-side and handed to your wallet unsigned. Your wallet shows you what it does; nothing moves unless you approve it there.",
  },
  {
    title: "The tokens land in your wallet",
    body: "Not in an account with us. Once the swap settles, the position is yours, held by you, and Vestail is no longer involved in it.",
  },
];

export function Custody() {
  return (
    <Section id="custody">
      <Lede>
        Vestail never holds your funds, your keys, or your tokens. There is no
        version of this where we can.
      </Lede>
      <div className="grid gap-3 sm:grid-cols-3">
        {FACTS.map((f) => (
          <div
            key={f.title}
            className="rounded-2xl bg-brand-navy/60 p-4 ring-1 ring-white/10"
          >
            <p className="font-bold text-white">{f.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-white/65">{f.body}</p>
          </div>
        ))}
      </div>
      <P>
        Purchases go through{" "}
        <Out href="https://dev.jup.ag/docs/swap-api">Jupiter&apos;s Swap API</Out>
        : Vestail asks for an order, your wallet signs it, and Vestail submits
        the signed transaction. Any API keys stay on the server and are never
        shipped to the browser.
      </P>
      <P>
        Between those steps there is one piece of plumbing worth knowing about.
        Each approved order is stamped with a short-lived signature tying it to
        that exact quote. The endpoint that submits transactions accepts only
        orders carrying a valid stamp, so Vestail&apos;s own market access
        cannot be borrowed to place a swap that never passed the eligibility
        check — including by someone calling the API directly.
      </P>
    </Section>
  );
}
