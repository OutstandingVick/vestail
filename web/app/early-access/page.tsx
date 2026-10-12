import type { Metadata } from "next";
import { notFound } from "next/navigation";

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
  if (process.env.NODE_ENV === "production") notFound();
  return <EarlyAccessShell><section className="mx-auto w-full max-w-[560px] px-4 pt-5 pb-8 sm:px-8 sm:pt-7"><div className="mb-8 text-center"><p className="mx-auto max-w-[520px] text-base leading-6 text-muted text-wrap-pretty">See what you can own where you are, and buy it where you&apos;re allowed.</p><p className="mt-6 text-xs font-bold uppercase tracking-[.16em] text-action-ink">Vestail early access</p><h1 className="mt-3 text-[clamp(2.25rem,6vw,3.25rem)] leading-[1.06] font-extrabold tracking-[-.035em] text-ink-strong text-wrap-balance">Find out what you can own, wherever you are.</h1><p className="mx-auto mt-4 max-w-[470px] text-base leading-6 text-muted text-wrap-pretty">Join early access and we&apos;ll email you when Vestail opens in your country.</p></div><EarlyAccessForm /></section></EarlyAccessShell>;
}
