import Image from "next/image";
import Link from "next/link";

import { DOCS_HREF } from "@/components/landing/LandingNav";
import { WalletButton } from "@/components/WalletButton";

/**
 * App header: the logo (home) on the left, the docs link and the wallet on
 * the right. Sits on the site gradient; the orange logo and the wallet
 * button both read on it.
 *
 * The docs link is here because /app is where the verdicts appear, and
 * "conditional" is a word the reader may well want explained at exactly
 * that moment.
 */
export function SiteHeader() {
  return (
    <header className="relative z-40">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" aria-label="Vestail home" className="shrink-0">
          <Image
            src="/brand/vestail-logo-nav.svg"
            alt="Vestail"
            width={141}
            height={32}
            priority
            unoptimized
            className="h-7 w-auto sm:h-8"
          />
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link
            href={DOCS_HREF}
            className="text-sm font-semibold text-white/80 transition-colors hover:text-white"
          >
            Docs
          </Link>
          <WalletButton />
        </div>
      </div>
    </header>
  );
}
