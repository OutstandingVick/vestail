import { CodeBlock } from "@/components/docs/CodeBlock";
import { Lede, Note, Out, P, Section } from "@/components/docs/blocks";
import { registry } from "@/lib/registry";

const PROOFS: Array<{ issuer: string; proof: string }> = [
  {
    issuer: "xStocks, Ondo",
    proof:
      "The mint authority onchain equals that issuer's single known authority.",
  },
  { issuer: "Tessera, PreStocks", proof: "Listed by the issuer's own API." },
  {
    issuer: "Backpack",
    proof:
      "Jupiter's verified and backpack tags, plus the token name. Weaker, and labelled as such: Backpack uses a different authority per token and publishes no mint list.",
  },
];

/** A real entry, so the reader can check one for themselves. */
function example(): string {
  const rep = registry.symbols.NVDA?.representations[0];
  if (!rep) return "";
  return JSON.stringify(
    {
      symbol: rep.symbol,
      provider: rep.provider,
      tokenSymbol: rep.tokenSymbol,
      mint: rep.mint,
      structure: rep.structure,
      decimals: rep.decimals,
      mintAuthority: rep.mintAuthority,
      freezeAuthority: rep.freezeAuthority,
    },
    null,
    2,
  );
}

export function Registry() {
  return (
    <Section id="registry">
      <Lede>
        A token symbol proves nothing. Anyone can mint a token called NVDAx
        this afternoon.
      </Lede>
      <P>
        Search that ticker on a Solana explorer and the real one sits in a
        list beside several look-alikes with the same symbol, the same name
        and no relationship to any issuer. An app that resolves a ticker by
        searching for it will eventually route someone&apos;s money into one
        of those. So Vestail does not search at purchase time. The set of
        mints is resolved in advance, committed to the repository, and each
        one needs proof tied to its issuer.
      </P>
      <ul className="space-y-px overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10">
        {PROOFS.map((p) => (
          <li key={p.issuer} className="bg-brand-navy/80 p-4">
            <p className="font-bold text-white">{p.issuer}</p>
            <p className="mt-1 text-sm leading-relaxed text-white/70">{p.proof}</p>
          </li>
        ))}
      </ul>
      <P>
        Each mint is then checked against the chain itself: it exists, it is
        owned by a token program, and its decimals match what was recorded.
        Any ambiguity aborts the sync rather than guessing, and the result is
        a file you can diff.
      </P>
      <CodeBlock caption="registry/representations.json — one entry" code={example()} />
      <Note title="Check it yourself">
        <p>
          Every mint address in the registry is in the repository, and every
          one of them resolves on any Solana explorer. If a mint in Vestail is
          not the token you think it is, that is a visible, checkable claim —
          which is the point of publishing it.
        </p>
      </Note>
      <P>
        <Out href="https://github.com/OutstandingVick/vestail/blob/main/registry/representations.json">
          The registry
        </Out>{" "}
        and{" "}
        <Out href="https://github.com/OutstandingVick/vestail/blob/main/scripts/sync-registry.mjs">
          the script that regenerates it
        </Out>{" "}
        are both public.
      </P>
    </Section>
  );
}
