"use client";

import { useState } from "react";

import { VerdictDot } from "@/components/VerdictDot";
import type { MatrixRow } from "@/lib/types";
import { VERDICT } from "@/lib/verdict";

/**
 * One country: its flag and name, then a circle per asset. Picking a circle
 * names the asset and its verdict in place of the prompt.
 */
export function CountryCard({ row, nameOf, mine }: { row: MatrixRow; nameOf: Record<string, string>; mine: boolean }) {
  const [picked, setPicked] = useState<string | null>(null);
  const cell = row.cells.find(c => c.asset === picked);

  return (
    <article aria-label={row.name} className={`flex flex-col gap-4 rounded-card bg-tint p-5 ${mine ? "ring-2 ring-emphasis" : ""}`}>
      <span aria-hidden="true" className="text-2xl leading-none">{row.flag}</span>
      <div className="flex flex-col gap-1">
        <h3 className="text-[17px] font-semibold">{row.name}{mine && <span className="ml-2 text-xs font-semibold text-emphasis">You</span>}</h3>
        <p className="min-h-5 text-xs text-muted" aria-live="polite">
          {cell ? <><strong className="text-ink">{nameOf[cell.asset] ?? cell.asset}</strong> · {VERDICT[cell.status].label}</> : "Pick a circle to see what you can own"}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {row.cells.map(c => (
          <VerdictDot key={c.asset} status={c.status} asset={nameOf[c.asset] ?? c.asset}
            selected={picked === c.asset} onSelect={() => setPicked(picked === c.asset ? null : c.asset)} />
        ))}
      </div>
    </article>
  );
}
