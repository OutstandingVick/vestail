import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { Logo } from "@/components/Logo";
import type { MarketingPage } from "@/lib/marketing-pages";

export function MarketingContentPage({ page }: { page: MarketingPage }) {
  return (
    <main className="min-h-screen bg-page text-ink">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex min-h-20 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
          <Link href="/" aria-label="Vestail home" className="inline-flex min-h-11 items-center">
            <Logo className="h-7 w-auto" />
          </Link>
          <div className="flex items-center gap-2 sm:gap-5">
            <nav aria-label="Public pages" className="hidden items-center gap-5 text-sm font-semibold text-muted md:flex">
              <Link href="/explore/all" className="hover:text-ink">Explore</Link>
              <Link href="/countries/supported" className="hover:text-ink">Countries</Link>
              <Link href="/company/about" className="hover:text-ink">Company</Link>
            </nav>
            <Link href="/app" className="inline-flex min-h-11 items-center rounded-full bg-action px-5 font-semibold text-on-action">
              Open App
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:py-24">
        <Link href="/" className="inline-flex min-h-11 w-fit items-center gap-2 text-sm font-semibold text-muted hover:text-ink">
          <ArrowLeft size={18} weight="regular" aria-hidden="true" /> Home
        </Link>

        <section className="max-w-4xl">
          <p className="mb-4 font-accent text-sm font-bold uppercase tracking-[0.14em] text-emphasis">{page.section}</p>
          <h1 className="text-[clamp(42px,7vw,80px)] leading-[0.98] font-extrabold tracking-[-0.045em] text-ink-strong">{page.title}</h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-muted sm:text-xl">{page.summary}</p>
        </section>

        <section aria-label={`${page.title} details`} className="grid gap-4 md:grid-cols-2">
          {page.sections.map((section, index) => (
            <article key={section.title} className="rounded-panel bg-surface p-6 ring-1 ring-line sm:p-8">
              <span className="mb-8 inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-tint px-3 text-sm font-bold text-emphasis">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h2 className="text-2xl font-bold tracking-[-0.025em] text-ink-strong">{section.title}</h2>
              <p className="mt-3 leading-7 text-muted">{section.body}</p>
              {section.items && (
                <ul className="mt-6 space-y-3 border-t border-line pt-5">
                  {section.items.map(item => (
                    <li key={item} className="flex gap-3 leading-6 text-ink">
                      <ArrowRight className="mt-1 shrink-0 text-action" size={17} weight="regular" aria-hidden="true" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </section>

        <aside className="flex flex-col items-start justify-between gap-5 rounded-panel bg-tint p-6 sm:flex-row sm:items-center sm:p-8">
          <div>
            <h2 className="text-xl font-bold">Check the rule for yourself</h2>
            <p className="mt-1 text-muted">Declare your country and buyer type, then search any supported asset.</p>
          </div>
          <Link href="/app/discover" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-action px-5 font-semibold text-on-action">
            Open Discover <ArrowRight size={18} weight="regular" aria-hidden="true" />
          </Link>
        </aside>
      </div>
    </main>
  );
}
