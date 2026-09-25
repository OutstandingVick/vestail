import Image from "next/image";
import Link from "next/link";

import { APP_HREF } from "@/components/landing/LandingNav";

/**
 * Docs header: logo home, and the one action that matters from a docs page.
 *
 * Sticky, because the page is long and the way out should never be more than
 * a glance away.
 *
 * It paints no background of its own. The page gradient is on a fixed
 * pseudo-element, so it does not scroll — which means a transparent header
 * shows exactly the same colours as the page under it, with nothing to draw
 * a line between the two. A tinted bar and a border did draw one, and on the
 * docs page, where the gradient is brightest right under the header, that
 * line read as a stripe across the top of the screen.
 *
 * What the header still needs is for text to stop being legible as it
 * scrolls underneath. A blur does that, masked so it fades out downwards
 * rather than ending on an edge of its own.
 */
export function DocsHeader() {
  return (
    <header className="sticky top-0 z-40">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 backdrop-blur-xl [mask-image:linear-gradient(to_bottom,#000_55%,transparent)]"
      />
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" aria-label="Vestail home" className="shrink-0">
            <Image
              src="/brand/vestail-logo-nav.svg"
              alt="Vestail"
              width={141}
              height={32}
              priority
              unoptimized
              className="h-7 w-auto"
            />
          </Link>
          <span aria-hidden className="text-white/40">/</span>
          <span className="text-sm font-semibold text-white/70">Docs</span>
        </div>

        <Link
          href={APP_HREF}
          className="rounded-full bg-brand-orange px-4 py-2 text-sm font-bold text-brand-navy transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white motion-reduce:transition-none"
        >
          Launch app
        </Link>
      </div>
    </header>
  );
}
