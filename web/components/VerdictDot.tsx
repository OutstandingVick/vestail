import type { Status } from "@/lib/types";
import { VERDICT } from "@/lib/verdict";

const FILL: Record<Status, string> = {
  can_own: "bg-can",
  conditional: "bg-cond",
  cannot_own: "bg-cannot hatch",
};

// Cannot-own stays hatched so the verdict never depends on colour.
export function VerdictDot({ status, asset, selected, onSelect }: {
  status: Status; asset: string; selected?: boolean; onSelect?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`${asset}: ${VERDICT[status].label}`}
      title={`${asset}: ${VERDICT[status].label}`}
      className={`${FILL[status]} size-8 shrink-0 rounded-full ring-offset-2 ring-offset-tint transition-transform hover:scale-110 focus-visible:ring-2 focus-visible:ring-emphasis focus-visible:outline-none ${
        selected ? "scale-110 ring-2 ring-ink" : ""
      }`}
    />
  );
}
