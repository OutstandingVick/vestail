import Link from "next/link";

import { VerdictBadge } from "@/components/VerdictBadge";
import type { Asset, Category, Cell, Status } from "@/lib/types";

/**
 * All 20 asset classes for the buyer's country and type, grouped by category,
 * each with its verdict. Equity classes are tagged when onchain versions exist.
 */
export function AssetBoard({ cells, assets, categories, onchain }: {
  cells: Cell[]; assets: Asset[]; categories: Category[]; onchain: Set<string>;
}) {
  // The API lists a category's assets by id; older data used names. Accept both.
  const byKey = new Map(assets.flatMap(a => [[a.id, a], [a.name, a]] as const));
  const status = new Map(cells.map(c => [c.asset, c.status]));
  const count = (s: Status) => cells.filter(c => c.status === s).length;

  return (
    <section aria-labelledby="board-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="board-title" className="text-2xl font-bold">Who can own what: {cells.length} asset classes</h2>
        <span className="text-sm text-muted">
          {count("can_own")} can own · {count("conditional")} conditional · {count("cannot_own")} cannot own
        </span>
      </div>
      <p className="-mt-2 text-sm text-muted">
        Ownership rules for your country and buyer type. These class rules aren&apos;t sourced yet, so treat them as a guide.
        Assets marked <span className="font-semibold text-emphasis">onchain</span> can be bought in Vestail.
      </p>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
        {categories.map(cat => (
          <div key={cat.id ?? cat.name} className="flex flex-col gap-2.5 rounded-card bg-surface p-[18px]">
            <h3 className="text-sm font-semibold tracking-[0.06em] text-muted uppercase">{cat.name}</h3>
            {cat.assets.map(name => {
              const a = byKey.get(name);
              const s = a && status.get(a.id);
              if (!a || !s) return null;
              return (
                <Link key={a.id} href={`/app/asset/${a.id}`} className="flex min-h-9 items-center justify-between gap-2.5 hover:text-emphasis">
                  <span className="text-[15px]">
                    {a.name}
                    {onchain.has(a.id) && (
                      <span className="ml-1.5 rounded-full border border-emphasis px-1.5 py-px text-[11px] font-semibold text-emphasis">onchain</span>
                    )}
                  </span>
                  <VerdictBadge status={s} />
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
