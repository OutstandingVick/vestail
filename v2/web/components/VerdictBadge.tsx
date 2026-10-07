import type { Status } from "@/lib/types";
import { VERDICT } from "@/lib/verdict";

const STYLE: Record<Status, string> = {
  can_own: "bg-can",
  conditional: "bg-cond",
  cannot_own: "bg-cannot hatch",
};

/** One verdict. Cannot-own is always hatched, so it never relies on colour alone. */
export function VerdictBadge({ status, size = "sm" }: { status: Status; size?: "sm" | "lg" }) {
  return (
    <span
      className={`${STYLE[status]} inline-flex shrink-0 items-center rounded-full font-bold whitespace-nowrap text-white ${
        size === "lg" ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-[13px]"
      }`}
    >
      {VERDICT[status].label}
    </span>
  );
}

/** A token no issuer rule covers here. Not a verdict, and not buyable. */
export function NotAssessedBadge() {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border-[1.5px] border-dashed border-muted px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap text-muted">
      Not assessed · can&apos;t buy
    </span>
  );
}
