import { Lede, Note, P, Section } from "@/components/docs/blocks";
import { IssuerTable } from "@/components/docs/IssuerTable";

export function Problem() {
  return (
    <Section id="problem">
      <Lede>
        A stock ticker is not one thing onchain. It is a name that several
        unrelated companies have each attached to a different legal product.
      </Lede>
      <P>
        Buy &ldquo;NVDA&rdquo; on Solana and, depending on which token you
        landed on, you may own a claim on a share sitting in a Swiss
        custodian, a debt note issued by a company in the British Virgin
        Islands, or an entitlement held for you by a licensed broker-dealer.
        Those are three different things. They price the same. They behave the
        same in your wallet. They differ in who is permitted to hold them,
        how — or whether — you can redeem them, and what you are left with if
        the issuer fails.
      </P>
      <IssuerTable />
      <Note title="The part nobody shows you">
        <p>
          Nothing in a wallet, an explorer or a token list distinguishes these.
          They render as one row with a ticker and a price. The distinction
          only exists in documents, and the documents are not where you are
          about to click Buy.
        </p>
      </Note>
    </Section>
  );
}
