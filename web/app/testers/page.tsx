import type { Metadata } from "next";

import { EarlyAccessShell } from "@/components/early-access/EarlyAccessShell";
import { TesterApplicationForm } from "@/components/testers/TesterApplicationForm";
import { TESTER_STEPS } from "@/lib/testers";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.vestail.fun"),
  title: "Call for Testers — Vestail",
  description: "Apply to test Vestail on mainnet and help us make ownership rules clearer.",
  alternates: { canonical: "https://www.vestail.fun/testers" },
  openGraph: { title: "Call for Testers — Vestail", description: "Limited spots. The first 10 get funded.", url: "https://www.vestail.fun/testers", siteName: "Vestail", images: [{ url: "/vestail-call-for-testers.png", width: 1200, height: 630 }], type: "website" },
  twitter: { card: "summary_large_image", title: "Call for Testers — Vestail", description: "Limited spots. The first 10 get funded.", images: ["/vestail-call-for-testers.png"] },
};

export default function TestersPage() {
  return <EarlyAccessShell><section className="mx-auto w-full max-w-[760px] px-4 pt-5 pb-8 sm:px-8 sm:pt-7"><div className="mb-8 text-center"><p className="text-xs font-bold uppercase tracking-[.16em] text-action-ink">Vestail testing programme</p><h1 className="mt-3 text-[clamp(2.5rem,7vw,4.5rem)] leading-[1.02] font-extrabold tracking-[-.045em] text-ink-strong text-wrap-balance">Call for Testers</h1><p className="mx-auto mt-4 max-w-[520px] text-lg leading-7 text-muted text-wrap-pretty">Limited spots. The first 10 get funded.</p></div><ol className="mb-5 grid gap-3 sm:grid-cols-2">{TESTER_STEPS.map(([title, detail], index) => <li key={title} className="flex gap-3 rounded-card border border-line bg-surface/75 p-4"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-action font-bold text-on-action">{index + 1}</span><span><strong className="block">{title}</strong><span className="mt-1 block text-sm leading-5 text-muted">{detail}</span></span></li>)}</ol><p className="mb-8 rounded-card border border-cond bg-cond-wash px-5 py-4 text-center text-sm font-semibold leading-6 text-cond-ink">Mainnet, real wallet. About 5 minutes. We will never ask for your seed phrase or private key.</p><TesterApplicationForm /></section></EarlyAccessShell>;
}
