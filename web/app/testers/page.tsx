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
  return <EarlyAccessShell><section className="mx-auto w-full max-w-[760px] px-4 pt-5 pb-8 sm:px-8 sm:pt-7"><div className="mb-8 text-center"><p className="text-xs font-bold uppercase tracking-[.16em] text-action-ink">Vestail testing programme</p><h1 className="mt-3 text-[clamp(2.5rem,7vw,4.5rem)] leading-[1.02] font-extrabold tracking-[-.045em] text-ink-strong text-wrap-balance">Call for Testers</h1><p className="mx-auto mt-4 max-w-[520px] text-lg leading-7 text-muted text-wrap-pretty">Limited spots. The first 10 get funded.</p></div><TesterApplicationForm /></section></EarlyAccessShell>;
}
