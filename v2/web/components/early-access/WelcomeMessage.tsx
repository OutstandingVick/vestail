"use client";

import Link from "next/link";

import { ShareActions } from "@/components/early-access/ShareActions";

export function WelcomeMessage({ firstName, country }: { firstName: string; country: string }) {
  return <div className="early-access-enter rounded-[28px] border border-white/70 bg-white/75 p-7 text-center shadow-[0_24px_70px_-36px_rgba(42,34,83,.35)] backdrop-blur sm:p-9" role="status"><span className="mx-auto grid size-12 place-items-center rounded-full bg-[#FF580A] text-2xl text-[#17171A]" aria-hidden="true">✓</span><h2 className="mt-5 text-3xl font-semibold tracking-[-.03em]">You&apos;re in, {firstName}.</h2><p className="mt-4 leading-7 text-[#5e5b65]">We&apos;ll email you as soon as Vestail opens in {country}. Until then, try our first product: find out which version of a tokenized stock you&apos;re allowed to hold.</p><Link href="https://www.vestail.fun" className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-[#FF580A] px-5 font-bold text-[#17171A] outline-none hover:bg-[#e94b00] focus-visible:ring-2 focus-visible:ring-[#17171A] focus-visible:ring-offset-2">Try Vestail for stocks</Link><div className="mt-8 border-t border-[#d8d6e8] pt-7"><ShareActions /></div></div>;
}
