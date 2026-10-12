import type { Icon } from "@phosphor-icons/react";

export function MetricCard({ label, value, detail, icon: Icon }: { label: string; value: string | number; detail: string; icon: Icon }) {
  return <article className="rounded-card border border-line bg-surface p-5"><div className="flex items-start justify-between gap-4"><p className="text-sm font-semibold text-muted">{label}</p><span className="grid size-9 place-items-center rounded-full bg-action-wash text-action-ink"><Icon size={18} weight="bold" aria-hidden="true" /></span></div><p className="mt-6 text-3xl font-bold tracking-tight tabular-nums">{value}</p><p className="mt-1 text-xs leading-5 text-muted">{detail}</p></article>;
}
