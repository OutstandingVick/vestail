import Image from "next/image";
import Link from "next/link";

/** Where "Launch app" goes, everywhere on the landing page. */
export const APP_HREF = "/app";

const DOCS_HREF = "https://github.com/OutstandingVick/vestail#readme";

/**
 * Landing navigation: logo left; "How it works", "Docs" and the orange
 * "Launch app" pill right. The two text links drop out below `sm` so the bar
 * never wraps or scrolls sideways on a phone; the pill always stays.
 */
export function LandingNav() {
  return (
    <header className="relative z-20">
      <nav
        aria-label="Main"
        className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-8"
      >
        <Link href="/" aria-label="Vestail home" className="shrink-0">
          {/*
            The nav variant: the supplied logo draws a full-bleed dark box,
            which would sit on the gradient as a black rectangle. SVG, so no
            optimisation pass: it would only rasterise it.
          */}
          <Image
            src="/brand/vestail-logo-nav.svg"
            alt="Vestail"
            width={141}
            height={32}
            priority
            unoptimized
            className="h-8 w-auto"
          />
        </Link>

        <div className="flex items-center gap-2 sm:gap-6">
          <a
            href="#how-it-works"
            className="hidden text-sm font-semibold text-white/80 transition-colors hover:text-white sm:inline"
          >
            How it works
          </a>
          <a
            href={DOCS_HREF}
            target="_blank"
            rel="noreferrer"
            className="hidden text-sm font-semibold text-white/80 transition-colors hover:text-white sm:inline"
          >
            Docs
          </a>
          <Link
            href={APP_HREF}
            className="rounded-full bg-brand-orange px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgb(255_88_10/0.7)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Launch app
          </Link>
        </div>
      </nav>
    </header>
  );
}
