import type { Icon } from "@phosphor-icons/react";

export function MetricCard({ label, value, detail, icon: Icon, featured = false }: { label: string; value: string | number; detail: string; icon: Icon; featured?: boolean }) {
  return (
    <article className={`min-h-40 rounded-card p-5 transition-transform duration-200 hover:-translate-y-0.5 ${featured ? "bg-gradient-to-br from-emphasis to-[#8D78FF] text-white shadow-[0_18px_44px_rgb(90_61_240/0.22)]" : "bg-surface shadow-[0_8px_28px_rgb(34_25_78/0.05)] ring-1 ring-line"}`}>
      <div className="flex items-start justify-between gap-4">
        <p className={`text-sm font-semibold ${featured ? "text-white/78" : "text-muted"}`}>{label}</p>
        <span className={`grid size-10 place-items-center rounded-full ${featured ? "bg-white/16 text-white" : "bg-action-wash text-action-ink"}`}><Icon size={19} weight="bold" aria-hidden="true" /></span>
      </div>
      <p className="mt-6 text-4xl font-bold tracking-[-0.04em] tabular-nums">{value}</p>
      <p className={`mt-2 max-w-[28ch] text-xs leading-5 ${featured ? "text-white/75" : "text-muted"}`}>{detail}</p>
    </article>
  );
}
