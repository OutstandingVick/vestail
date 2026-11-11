"use client";

import type { UtilityRisk } from "@/lib/types";
import { RISK_TEXT } from "@/lib/utilities";

/**
 * The checkbox lend, borrow and earn need before any transaction, like the
 * acknowledgement on conditional verdicts. It states the risk in plain words
 * and, for a conditional option, the condition too.
 */
export function RiskAcknowledgement({ id, risk, conditions, checked, onChange }: {
  id: string; risk: UtilityRisk | null; conditions: string[]; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-field bg-cond-wash p-3.5">
      {risk && <p className="text-sm text-cond-ink"><strong>Risk:</strong> {RISK_TEXT[risk]}</p>}
      {conditions.map(c => <p key={c} className="text-sm text-cond-ink"><strong>Condition:</strong> {c}</p>)}
      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-start gap-2.5 text-sm">
        <input id={id} type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="mt-0.5 size-5 shrink-0 accent-action" />
        <span>I understand{risk ? " this risk" : ""}{risk && conditions.length ? " and" : ""}{conditions.length ? " the condition above" : ""}, and that I sign every transaction myself.</span>
      </label>
    </div>
  );
}
