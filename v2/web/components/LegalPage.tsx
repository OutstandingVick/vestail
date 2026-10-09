import Link from "next/link";

import { Logo } from "@/components/Logo";

export function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-[820px] px-5 py-8 sm:py-12">
      <Link href="/" aria-label="Back to Vestail" className="inline-block"><Logo /></Link>
      <main className="mt-14 rounded-panel bg-surface p-6 sm:p-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-ink-strong">{title}</h1>
        <p className="mt-2 text-sm text-muted">Effective 8 October 2026</p>
        <div className="mt-8 space-y-6 text-[15px] leading-7 text-ink">{children}</div>
      </main>
    </div>
  );
}
