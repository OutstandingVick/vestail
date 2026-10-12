import type { Metadata } from "next";

import { LegalPage } from "@/components/LegalPage";

export const metadata: Metadata = { title: "Privacy · Vestail" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy">
      <section><h2 className="font-bold">Information you provide</h2><p>Vestail stores your sign-in details through Privy, your self-declared country and buyer type, display name, avatar preferences, watchlist, and product activity needed to provide the service. Vestail does not perform KYC or infer your country.</p></section>
      <section><h2 className="font-bold">Wallet information</h2><p>Your public wallet address and onchain balances are used to show your portfolio and prepare transactions. Wallet transactions are public by nature. Vestail never asks you to send it your private key.</p></section>
      <section><h2 className="font-bold">How information is used</h2><p>Information is used to authenticate you, calculate ownership guidance, show your portfolio, remember your preferences, and operate and secure Vestail. It is not sold.</p></section>
      <section><h2 className="font-bold">Storage</h2><p>Profile information is stored with Privy and in Vestail&apos;s application storage. Uploaded profile photos and app preferences remain until you replace or remove them, subject to operational backups.</p></section>
    </LegalPage>
  );
}
