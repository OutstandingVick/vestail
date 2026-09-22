import Image from "next/image";
import Link from "next/link";

import { WalletButton } from "@/components/WalletButton";

/**
 * App header: the logo (home) on the left, the wallet on the right. Sits on
 * the site gradient; the orange logo and the wallet button's own surface
 * both read on it.
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
        <WalletButton />
      </div>
    </header>
  );
}
