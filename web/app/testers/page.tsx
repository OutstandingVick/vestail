import type { Metadata } from "next";

import { EarlyAccessShell } from "@/components/early-access/EarlyAccessShell";
import { TesterApplicationForm } from "@/components/testers/TesterApplicationForm";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.vestail.fun"),
  title: "Call for Testers — Vestail",
  description: "Apply to test Vestail on mainnet and help us make ownership rules clearer.",
  alternates: { canonical: "https://www.vestail.fun/testers" },
  openGraph: { title: "Call for Testers — Vestail", description: "Limited spots. The first 10 get funded.", url: "https://www.vestail.fun/testers", siteName: "Vestail", images: [{ url: "/vestail-call-for-testers.png", width: 1200, height: 630 }], type: "website" },
  twitter: { card: "summary_large_image", title: "Call for Testers — Vestail", description: "Limited spots. The first 10 get funded.", images: ["/vestail-call-for-testers.png"] },
};

export default function TestersPage() {
  return <EarlyAccessShell><section className="mx-auto w-full max-w-[760px] px-4 pt-5 pb-8 sm:px-8 sm:pt-7"><TesterApplicationForm /></section></EarlyAccessShell>;
}
