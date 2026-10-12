import type { Metadata } from "next";
import Link from "next/link";

import { AdminGate } from "@/components/admin/AdminGate";
import { AdminNav } from "@/components/admin/AdminNav";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "Owner dashboard · Vestail", robots: { index: false, follow: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminGate><div className="min-h-screen bg-page lg:grid lg:grid-cols-[248px_minmax(0,1fr)]"><a href="#admin-content" className="sr-only z-50 rounded-full bg-ink-strong px-4 py-2 text-on-ink focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to dashboard</a><aside className="border-b border-line bg-surface p-4 lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-b-0 lg:p-5"><div className="flex items-center justify-between gap-4 lg:block"><Link href="/admin" aria-label="Vestail owner dashboard"><Logo className="h-7 w-auto" /></Link><span className="rounded-full bg-action-wash px-3 py-1 text-xs font-bold text-action-ink lg:mt-4 lg:inline-flex">Owner</span></div><div className="mt-4 lg:mt-10"><AdminNav /></div><p className="mt-8 hidden text-xs leading-5 text-muted lg:block">Private operational view. Customer declarations are self-reported and must not be treated as KYC.</p></aside><main id="admin-content" className="min-w-0 p-5 sm:p-8 lg:p-10 xl:p-12">{children}</main></div></AdminGate>;
}
