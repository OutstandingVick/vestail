import type { Metadata } from "next";

import { EarlyAccessForm } from "@/components/early-access/EarlyAccessForm";
import { EarlyAccessShell } from "@/components/early-access/EarlyAccessShell";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.vestail.fun"),
  title: "Early access — Vestail",
  description: "Join Vestail early access and find out what you can own, wherever you are.",
  alternates: { canonical: "https://www.vestail.fun/early-access" },
  openGraph: { title: "Early access — Vestail", description: "Find out what you can own, wherever you are.", url: "https://www.vestail.fun/early-access", siteName: "Vestail", images: [{ url: "/early-access/opengraph-image", width: 1200, height: 630 }], type: "website" },
  twitter: { card: "summary_large_image", title: "Early access — Vestail", description: "Find out what you can own, wherever you are.", images: ["/early-access/opengraph-image"] },
};

export default function EarlyAccessPage() {
  return <EarlyAccessShell><section className="mx-auto w-full max-w-[560px] px-5 pt-10 pb-20 sm:px-8 sm:pt-16"><div className="mb-10 text-center"><p className="text-sm font-bold uppercase tracking-[.16em] text-[#B83D00]">Vestail early access</p><h1 className="mt-4 text-[clamp(2.4rem,7vw,4.25rem)] leading-[.98] font-semibold tracking-[-.045em]">Find out what you can own, wherever you are.</h1><p className="mx-auto mt-5 max-w-[470px] text-lg leading-7 text-[#5e5b65]">Join early access to Vestail. We&apos;ll let you in as your country goes live.</p></div><EarlyAccessForm /></section></EarlyAccessShell>;
}
