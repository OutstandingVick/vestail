import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Logo } from "@/components/Logo";
import { MARKETING_PAGES } from "@/lib/marketing-pages";
import { absolute, SITE_NAME } from "@/lib/seo";

const SECTIONS = {
  explore: {
    title: "Explore ownership",
    summary: "Learn how Vestail resolves an asset, compares access and explains the ownership verdict before offering a route.",
  },
  countries: {
    title: "Country coverage",
    summary: "Review the markets, buyer profiles and ownership rules currently represented in Vestail.",
  },
  company: {
    title: "About Vestail",
    summary: "Understand the mission, methodology, catalogue and ways to contact the team.",
  },
} as const;

type Section = keyof typeof SECTIONS;
type PageProps = { params: Promise<{ section: string }> };

export function generateStaticParams() {
  return Object.keys(SECTIONS).map(section => ({ section }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { section } = await params;
  if (!(section in SECTIONS)) return {};
  const content = SECTIONS[section as Section];
  const url = absolute(`/${section}`);
  return {
    title: content.title,
    description: content.summary,
    alternates: { canonical: url },
    openGraph: { title: content.title, description: content.summary, url, siteName: SITE_NAME },
  };
}

export default async function MarketingSectionPage({ params }: PageProps) {
  const { section } = await params;
  if (!(section in SECTIONS)) notFound();

  const content = SECTIONS[section as Section];
  const pages = Object.entries(MARKETING_PAGES).filter(([, page]) => page.section.toLowerCase() === section);
  const breadcrumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: absolute("/") },
      { "@type": "ListItem", position: 2, name: content.title, item: absolute(`/${section}`) },
    ],
  };

  return (
    <main className="min-h-screen bg-page text-ink">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }} />
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex min-h-20 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" aria-label="Vestail home" className="inline-flex min-h-11 items-center"><Logo className="h-7 w-auto" /></Link>
          <Link href="/app" className="inline-flex min-h-11 items-center rounded-full bg-action px-5 font-semibold text-on-action">Open app</Link>
        </div>
      </header>
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        <p className="font-accent text-sm font-bold uppercase tracking-[0.14em] text-emphasis">{section}</p>
        <h1 className="mt-4 max-w-4xl text-balance text-[clamp(42px,7vw,80px)] font-extrabold leading-[0.98] tracking-[-0.045em] text-ink-strong">{content.title}</h1>
        <p className="mt-7 max-w-3xl text-pretty text-lg leading-8 text-muted sm:text-xl">{content.summary}</p>
        <section className="mt-12 grid gap-4 md:grid-cols-2" aria-label={`${content.title} pages`}>
          {pages.map(([key, page]) => (
            <Link key={key} href={`/${key}`} className="group rounded-panel bg-surface p-6 ring-1 ring-line transition-transform duration-150 hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emphasis sm:p-8">
              <div className="flex items-start justify-between gap-5">
                <div><h2 className="text-2xl font-bold tracking-[-0.025em] text-ink-strong">{page.title}</h2><p className="mt-3 text-pretty leading-7 text-muted">{page.summary}</p></div>
                <ArrowRight className="mt-1 shrink-0 text-action transition-transform duration-150 group-hover:translate-x-1" size={20} aria-hidden="true" />
              </div>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
