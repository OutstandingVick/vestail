import { CheckCircle, Info, WarningCircle, XCircle } from "@phosphor-icons/react/dist/ssr";

import type { UtilityVerdict } from "@/lib/types";
import { VERDICT_LABEL } from "@/lib/utilities";

/**
 * A utility's verdict, in the same visual language as hold verdicts:
 * restricted is hatched and unverified is dashed, so neither relies on colour.
 */
export function UtilityVerdictBadge({ verdict }: { verdict: UtilityVerdict }) {
  if (verdict === "unverified") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border-[1.5px] border-dashed border-muted px-3 py-1.5 text-[13px] font-semibold whitespace-nowrap text-muted">
        <Info size={16} aria-hidden="true" />{VERDICT_LABEL.unverified}
      </span>
    );
  }
  const style = { eligible: "bg-can", conditional: "bg-cond", restricted: "bg-cannot hatch" }[verdict];
  const Icon = { eligible: CheckCircle, conditional: WarningCircle, restricted: XCircle }[verdict];
  return (
    <span className={`${style} inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-bold whitespace-nowrap text-white`}>
      <Icon size={16} weight="fill" aria-hidden="true" />{VERDICT_LABEL[verdict]}
    </span>
  );
}
