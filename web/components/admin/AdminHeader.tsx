"use client";

import {
  ArrowClockwise,
  ArrowSquareOut,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import Link from "next/link";

import { useAdminOverview } from "@/components/admin/AdminContext";

export function AdminHeader({ title, description }: { title: string; description: string }) {
  const { generatedAt } = useAdminOverview();
  return (
    <header>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-surface px-4 py-3 shadow-[0_8px_28px_rgb(34_25_78/0.05)] ring-1 ring-line sm:px-5">
        <div className="flex min-w-0 items-center gap-3 text-muted">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-wash"><MagnifyingGlass size={17} aria-hidden="true" /></span>
          <span className="truncate text-sm">Vestail owner workspace</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden px-2 text-xs text-muted sm:inline">Updated {new Date(generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          <button type="button" onClick={() => location.reload()} aria-label="Refresh dashboard" className="grid size-10 place-items-center rounded-full bg-wash text-ink transition-transform duration-150 active:scale-96 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emphasis"><ArrowClockwise size={17} aria-hidden="true" /></button>
          <Link href="/app" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-ink-strong px-4 text-sm font-semibold text-on-ink transition-transform duration-150 active:scale-96 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emphasis">Open app<ArrowSquareOut size={16} aria-hidden="true" /></Link>
        </div>
      </div>
      <div className="mt-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-action-ink">Owner dashboard</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p>
        </div>
      </div>
    </header>
  );
}
