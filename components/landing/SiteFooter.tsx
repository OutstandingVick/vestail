import Image from "next/image";
import Link from "next/link";

import { CoinPile } from "@/components/landing/CoinPile";
import { DOCS_HREF } from "@/components/landing/LandingNav";

const REPO = "https://github.com/OutstandingVick/vestail";

interface FooterLink {
  label: string;
  /** null renders the label without a link: nothing to point it at yet. */
  href: string | null;
  external?: boolean;
}

const COLUMNS: Array<{ label: string; links: FooterLink[] }> = [
  {
    label: "Explore",
    links: [
      { label: "How it works", href: `${DOCS_HREF}#how-it-works` },
      { label: "The problem", href: `${DOCS_HREF}#problem` },
      { label: "Roadmap", href: `${REPO}#status`, external: true },
    ],
  },
  {
    label: "Connect",
    links: [
      { label: "GitHub", href: REPO, external: true },
      // No account exists yet; a link to a handle that is not ours would be
      // worse than none.
      { label: "X / Twitter", href: null },
      { label: "Docs", href: DOCS_HREF },
    ],
  },
];

function FooterLinkItem({ link }: { link: FooterLink }) {
  const className =
    "text-lg font-semibold text-white transition-colors hover:text-brand-orange focus-visible:text-brand-orange focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange";

  if (link.href === null) {
    return (
      <span className="flex items-baseline gap-2 text-lg font-semibold text-white/55">
        {link.label}
        <span className="text-xs font-bold uppercase tracking-widest text-white/55">
          soon
        </span>
      </span>
    );
  }
  if (link.external) {
    return (
      <a href={link.href} target="_blank" rel="noreferrer" className={className}>
        {link.label}
      </a>
    );
  }
  return (
    <Link href={link.href} className={className}>
      {link.label}
    </Link>
  );
}

/**
 * The landing page's footer: three columns of links, a wordmark the width
 * of the page, a legal bar, and the coin pile heaped under all of it.
 *
 * The columns stack below 900px — an arbitrary breakpoint rather than a
 * named one, because three columns of this text run out of room at that
 * width rather than at 768 or 1024.
 *
 * `overflow-hidden` on the footer is load-bearing: both the wordmark and
 * the coin band are deliberately wider than their container, and without
 * it either would scroll the whole page sideways.
 */
export function SiteFooter() {
  return (
    <footer className="relative mt-24 overflow-hidden">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-8">
        <div className="grid gap-10 min-[900px]:grid-cols-3">
          {COLUMNS.map((column) => (
            <div key={column.label}>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
                {column.label}
              </p>
              <ul className="mt-4 space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <FooterLinkItem link={link} />
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/55">
              Vestail
            </p>
            <p className="mt-4 text-lg font-semibold text-white">
              Built for STOCKLANA
            </p>
            <p className="mt-4 max-w-xs leading-relaxed text-white/65">
              Vestail never holds your funds. You sign every transaction
              yourself. Not investment advice.
            </p>
            <p className="mt-4 text-white/65">Yenagoa, Nigeria</p>
          </div>
        </div>

        {/*
          The lockup. Container query units, not vw: the word is sized
          against this column's width, so it fills the page at any viewport
          without running past it on an ultra-wide screen.
        */}
        <div className="@container mt-20">
          <div className="flex items-center gap-[0.08em] text-[clamp(2.5rem,27.5cqw,22rem)] leading-[0.78]">
            {/*
              The nav variant of the icon: the supplied one draws a
              full-bleed dark box, which sits on the gradient as a black
              square beside the wordmark.
            */}
            <Image
              src="/brand/vestail-icon-nav.svg"
              alt=""
              aria-hidden
              width={102}
              height={93}
              unoptimized
              className="h-[0.82em] w-auto shrink-0"
            />
            <span className="select-none font-bold tracking-[-0.04em] text-white/85">
              vestail
            </span>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 py-6 text-sm text-white/55">
          <div className="flex gap-6">
            {/* The docs sections that actually state each position. */}
            <Link href={`${DOCS_HREF}#disclosure`} className="transition-colors hover:text-brand-orange">
              Privacy
            </Link>
            <Link href={`${DOCS_HREF}#limits`} className="transition-colors hover:text-brand-orange">
              Terms
            </Link>
          </div>
          <p>© 2026 Vestail</p>
        </div>
      </div>

      <CoinPile />
    </footer>
  );
}
