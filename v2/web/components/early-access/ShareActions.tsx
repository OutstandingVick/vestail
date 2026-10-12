"use client";

import { Check, Copy, XLogo } from "@phosphor-icons/react";
import { useState } from "react";

import { EARLY_ACCESS_URL } from "@/lib/early-access";

export function ShareActions() {
  const [copied, setCopied] = useState(false);
  async function copy() { await navigator.clipboard.writeText(EARLY_ACCESS_URL); setCopied(true); window.setTimeout(() => setCopied(false), 1800); }
  const x = `https://x.com/intent/post?${new URLSearchParams({ text: "Find out what you can own, wherever you are.", url: EARLY_ACCESS_URL })}`;
  return <div><p className="text-sm font-semibold">Know someone who&apos;d want this?</p><div className="mt-3 flex flex-wrap justify-center gap-2"><button type="button" onClick={copy} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#cbc9df] bg-white px-4 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-[#17171A]"><span aria-live="polite">{copied ? "Copied" : "Copy link"}</span>{copied ? <Check size={17} aria-hidden="true" /> : <Copy size={17} aria-hidden="true" />}</button><a href={x} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#cbc9df] bg-white px-4 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-[#17171A]">Share to X<XLogo size={17} aria-hidden="true" /></a></div></div>;
}
