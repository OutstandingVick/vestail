import Link from "next/link";

import { Logo } from "@/components/Logo";

export function LegalPage({ title, children, sections = [] }: { title: string; children?: React.ReactNode; sections?: { id: string; title: string; body: string }[] }) {
  return (
    <div className="mx-auto min-h-screen max-w-[820px] px-5 py-8 sm:py-12">
      <div dangerouslySetInnerHTML={{ __html: "<!-- LAWYER REVIEW REQUIRED -->" }} />
      <Link href="/" aria-label="Back to Vestail" className="inline-block"><Logo /></Link>
      <main className="mt-14 rounded-panel bg-surface p-6 sm:p-10">
        <h1 className="text-4xl font-extrabold tracking-tight text-ink-strong">{title}</h1>
        <p className="mt-2 text-sm text-muted">Last updated: <time dateTime="2026-10-22">22 October 2026</time></p>
        <nav aria-label="Table of contents" className="mt-8"><h2 className="font-bold">On this page</h2><ul className="mt-3 space-y-2">{sections.map(section => <li key={section.id}><a className="underline" href={`#${section.id}`}>{section.title}</a></li>)}</ul></nav>
        <div className="mt-8 space-y-6 text-[15px] leading-7 text-ink">{sections.map(section => <section key={section.id} id={section.id} className="scroll-mt-8"><h2 className="font-bold text-xl">{section.title}</h2><p>{section.body}</p></section>)}</div>
        <div className="mt-8 space-y-6 text-[15px] leading-7 text-ink">{children}</div>
      </main>
      <footer className="mt-8 flex flex-wrap gap-5 text-sm text-muted"><Link href="/terms">Terms</Link><Link href="/privacy">Privacy</Link><Link href="/cookies">Cookies</Link><Link href="/docs">Docs</Link><button type="button" data-cookie-settings>Cookie settings</button></footer>
    </div>
  );
}
