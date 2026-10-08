"use client";

import Link from "next/link";
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
      {cell && (
        // Where to go next. Only the buyer's own country can be bought from; a
        // cannot-own cell is never routed, so it gets the comparison instead.
        <Link
          href={mine && cell.status !== "cannot_own" ? `/app/asset/${cell.asset}` : `/app/compare?asset=${cell.asset}&who=${row.who}`}
          className="-mt-2 text-xs font-semibold text-emphasis"
        >
          {mine && cell.status !== "cannot_own" ? "See where to buy →" : `Compare ${nameOf[cell.asset] ?? cell.asset} across countries →`}
        </Link>
      )}
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label={`${row.name}: assets`}
        onKeyDown={e => {
          // Left/right (and up/down) move between circles instead of tabbing through all of them.
          const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
          if (!(e.key in keys)) return;
          const dots = [...e.currentTarget.querySelectorAll("button")];
          const i = dots.indexOf(document.activeElement as HTMLButtonElement);
          if (i < 0) return;
          e.preventDefault();
          dots[(i + keys[e.key] + dots.length) % dots.length].focus();
        }}
      >
        {row.cells.map(c => (
          <VerdictDot key={c.asset} status={c.status} asset={nameOf[c.asset] ?? c.asset}
            selected={picked === c.asset} onSelect={() => setPicked(picked === c.asset ? null : c.asset)} />
        ))}
      </div>
    </article>
  );
}
