import type { Metadata } from "next";

import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Terms · Vestail" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms">
      <section><h2 className="font-bold">Informational service</h2><p>Vestail helps you explore ownership rules and routes to third-party venues. It does not provide legal, tax, or investment advice, and it does not guarantee that any rule, source, price, or venue is complete or current.</p></section>
      <section><h2 className="font-bold">Your declarations</h2><p>Results depend on the country and buyer type you declare. You are responsible for providing accurate information and obtaining professional advice where needed.</p></section>
      <section><h2 className="font-bold">Transactions and third parties</h2><p>Trades and wallet actions are carried out through your wallet and third-party networks or venues. Their terms, fees, availability, and risks apply. You are responsible for reviewing transaction details before signing.</p></section>
      <section><h2 className="font-bold">No warranty</h2><p>Vestail is provided as available. To the extent permitted by law, Vestail is not responsible for losses caused by reliance on the service, third-party services, network conditions, or user error.</p></section>
    </LegalPage>
  );
}
