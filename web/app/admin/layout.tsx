import type { Metadata } from "next";
import Link from "next/link";

import { AdminGate } from "@/components/admin/AdminGate";
import { AdminNav } from "@/components/admin/AdminNav";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "Owner dashboard · Vestail",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGate>
      <div className="min-h-screen bg-tint p-2 sm:p-5 lg:p-6">
        <a href="#admin-content" className="sr-only z-50 rounded-full bg-ink-strong px-4 py-2 text-on-ink focus:not-sr-only focus:fixed focus:start-4 focus:top-4">
          Skip to dashboard
        </a>
        <div className="mx-auto min-h-[calc(100vh-24px)] max-w-[1600px] overflow-hidden rounded-panel bg-page shadow-[0_24px_80px_rgb(90_61_240/0.12)] ring-1 ring-emphasis/10 sm:min-h-[calc(100vh-40px)] lg:grid lg:min-h-[calc(100vh-48px)] lg:grid-cols-[252px_minmax(0,1fr)]">
          <aside className="border-b border-line bg-surface p-4 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-e lg:p-5">
            <div className="flex items-center justify-between gap-4">
              <Link href="/admin" aria-label="Vestail owner dashboard" className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emphasis">
                <Logo className="h-7 w-auto" />
              </Link>
              <ThemeToggle />
            </div>
            <div className="mt-5 lg:mt-10"><AdminNav /></div>
            <div className="mt-auto hidden rounded-field bg-wash p-4 lg:block">
              <p className="text-xs font-bold uppercase tracking-[.14em] text-action-ink">Owner only</p>
              <p className="mt-2 text-xs leading-5 text-muted">Buyer declarations are self-reported and are not identity verification.</p>
            </div>
          </aside>
          <main id="admin-content" className="min-w-0 p-4 sm:p-6 lg:p-8 xl:p-10">{children}</main>
        </div>
      </div>
    </AdminGate>
  );
}
