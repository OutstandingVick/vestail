import Link from "next/link";

/** Quiet legal context that follows the product without competing with it. */
export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-field py-6 text-sm text-muted" aria-label="Vestail footer">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p>Vestail is an informational guide. Not legal, tax, or investment advice.</p>
        <nav aria-label="Legal and product information" className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link href="/#methodology" className="min-h-11 content-center hover:text-ink">Methodology</Link>
          <Link href="/privacy" className="min-h-11 content-center hover:text-ink">Privacy</Link>
          <Link href="/terms" className="min-h-11 content-center hover:text-ink">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}
