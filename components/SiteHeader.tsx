import { WalletButton } from "@/components/WalletButton";

/**
 * Site header: wordmark on the left, wallet connect on the right.
 *
 * Deliberately thin. Phase 0 has one page, and a nav bar with a single
 * destination is furniture.
 *
 * Sits on a navy bar: the site gradient's violet end is too light behind
 * this header's dim label (about 1.9:1).
 */
export function SiteHeader() {
  return (
    <header className="border-b border-line bg-ink/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-5">
        <div className="flex items-baseline gap-3">
          <span className="font-display text-xl tracking-tight text-paper">
            Vestail
          </span>
          <span className="hidden text-xs uppercase tracking-[0.18em] text-dim sm:inline">
            Tokenized equity eligibility
          </span>
        </div>

        <WalletButton />
      </div>
    </header>
  );
}
