import { BoardControls } from "@/components/BoardControls";
import { BoardLegend } from "@/components/BoardLegend";
import { CountryCard } from "@/components/CountryCard";
import type { BuyerType, MatrixRow } from "@/lib/types";

/**
 * The search's answer across every country: a card per country, a circle per
 * matching asset. The buyer's own country leads; the rest follow the API's
 * order (most open first, or as listed).
 */
export function CountryBoard({ q, rows, nameOf, who, sort, mine }: {
  q: string; rows: MatrixRow[]; nameOf: Record<string, string>; who: BuyerType; sort: "status" | "asset"; mine: string;
}) {
  const ordered = [...rows.filter(r => r.code === mine), ...rows.filter(r => r.code !== mine)];
  const assets = rows[0]?.cells.length ?? 0;

  return (
    <section aria-labelledby="board-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BoardControls q={q} who={who} sort={sort} />
        <BoardLegend />
      </div>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="board-title" className="text-xs font-semibold tracking-[0.08em] text-muted uppercase">
          {assets} {assets === 1 ? "asset" : "assets"} per country · {who}s · {sort === "status" ? "most open first" : "in asset order"}
        </h2>
        <p className="text-xs text-muted">Class rules aren&apos;t sourced yet: treat them as a guide.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ordered.map(r => <CountryCard key={r.code} row={r} nameOf={nameOf} mine={r.code === mine} />)}
      </div>
    </section>
  );
}
