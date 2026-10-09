import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import type { Resolution } from "@/lib/types";

const STAGE: Record<Resolution["stage"], string> = {
  entity: "a named company or asset",
  alias: "an everyday word",
  category: "a category",
  asset: "an asset class name",
  all: "everything",
  none: "nothing",
};

/** How the resolver read the query. Every hit shows its trail; nothing resolves silently. */
export function Trail({ q, resolution }: { q: string; resolution: Resolution }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[13px] text-muted">
        How we read “{q}” · matched as <strong className="text-ink">{STAGE[resolution.stage]}</strong>
      </p>
      <ol className="flex flex-wrap items-center gap-1.5 text-sm">
        {resolution.trail.map((step, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 && <CaretRight size={14} weight="regular" className="text-muted" aria-hidden="true" />}
            <span className={`rounded-full bg-tint px-3 py-1.5 ${i === resolution.trail.length - 1 ? "font-semibold text-emphasis" : ""}`}>{step}</span>
          </li>
        ))}
      </ol>
      {resolution.note && <p className="text-sm text-muted">{resolution.note}</p>}
    </div>
  );
}
