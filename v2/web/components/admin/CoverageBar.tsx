import type { Status } from "@/lib/types";

const tone: Record<Status, string> = { can_own: "bg-can", conditional: "bg-cond", cannot_own: "bg-cannot hatch" };

export function CoverageBar({ totals }: { totals: Record<Status, number> }) {
  const all = totals.can_own + totals.conditional + totals.cannot_own;
  if (!all) return <div className="h-2 rounded-full bg-line" aria-label="No assessed rules" />;
  return <div className="flex h-2 overflow-hidden rounded-full bg-line" aria-label={`${totals.can_own} can own, ${totals.conditional} conditional, ${totals.cannot_own} cannot own`}>{(["can_own", "conditional", "cannot_own"] as Status[]).map(status => totals[status] ? <span key={status} className={tone[status]} style={{ width: `${totals[status] / all * 100}%` }} /> : null)}</div>;
}
