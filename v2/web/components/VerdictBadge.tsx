import { CheckCircle, Info, WarningCircle, XCircle } from "@phosphor-icons/react/dist/ssr";
import type { Status } from "@/lib/types";
import { VERDICT } from "@/lib/verdict";

const STYLE: Record<Status, string> = {
  can_own: "bg-can",
  conditional: "bg-cond",
  cannot_own: "bg-cannot hatch",
};

const ICON = { can_own: CheckCircle, conditional: WarningCircle, cannot_own: XCircle } as const;

/** One verdict. Cannot-own is always hatched, so it never relies on colour alone. */
export function VerdictBadge({ status, size = "sm" }: { status: Status; size?: "sm" | "lg" }) {
  const StatusIcon = ICON[status];
  return (
    <span
      className={`${STYLE[status]} inline-flex shrink-0 items-center gap-1.5 rounded-full font-bold whitespace-nowrap text-white ${
        size === "lg" ? "px-4 py-2 text-sm" : "px-3 py-1.5 text-[13px]"
      }`}
    >
      <StatusIcon size={size === "lg" ? 18 : 16} weight="fill" aria-hidden="true" />
      {VERDICT[status].label}
    </span>
  );
}

/** A token no issuer rule covers here. Not a verdict, and not buyable. */
export function NotAssessedBadge() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border-[1.5px] border-dashed border-muted px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap text-muted">
      <Info size={16} weight="regular" aria-hidden="true" />
      Not assessed · can&apos;t buy
    </span>
  );
}
