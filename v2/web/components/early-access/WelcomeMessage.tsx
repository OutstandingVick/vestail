"use client";

import Link from "next/link";

import { ShareActions } from "@/components/early-access/ShareActions";

export function WelcomeMessage({ firstName, country }: { firstName: string; country: string }) {
  return <div className="early-access-enter rounded-panel border border-line bg-surface/90 p-7 text-center shadow-[0_30px_80px_-30px_rgba(124,92,255,0.35)] backdrop-blur sm:p-9" role="status"><span className="mx-auto grid size-12 place-items-center rounded-full bg-action text-2xl text-on-action" aria-hidden="true">✓</span><h2 className="mt-5 text-3xl font-bold tracking-[-.03em] text-ink-strong text-wrap-balance">You&apos;re in, {firstName}.</h2><p className="mt-4 leading-7 text-muted text-wrap-pretty">We&apos;ll email you as soon as Vestail opens in {country}. Until then, find out which version of a tokenized stock you&apos;re allowed to hold.</p><Link href="https://www.vestail.fun" className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-action px-5 font-bold text-on-action outline-none transition-transform duration-150 active:scale-[.96] focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2">Open Vestail</Link><div className="mt-8 border-t border-line pt-7"><ShareActions /></div></div>;
}
