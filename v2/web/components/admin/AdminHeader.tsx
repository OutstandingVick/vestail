"use client";

import { ArrowClockwise, ArrowSquareOut } from "@phosphor-icons/react";
import Link from "next/link";

import { useAdminOverview } from "@/components/admin/AdminContext";

export function AdminHeader({ title, description }: { title: string; description: string }) {
  const { generatedAt } = useAdminOverview();
  return <header className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-bold uppercase tracking-[.18em] text-action">Owner workspace</p><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{description}</p></div><div className="flex flex-wrap items-center gap-2"><span className="px-2 text-xs text-muted">Updated {new Date(generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span><button type="button" onClick={() => location.reload()} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-field bg-surface px-4 text-sm font-semibold"><ArrowClockwise size={16} aria-hidden="true" />Refresh</button><Link href="/app" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-field bg-surface px-4 text-sm font-semibold">Open app<ArrowSquareOut size={16} aria-hidden="true" /></Link></div></header>;
}
