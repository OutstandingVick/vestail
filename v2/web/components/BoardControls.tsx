import Link from "next/link";

import type { BuyerType } from "@/lib/types";

/**
 * Citizens / Foreigners and By status / By asset. Plain links that rewrite the
 * search URL, so every view of the board can be shared or reloaded. Viewing as
 * a foreigner here doesn't change the buyer's own declared profile.
 */
export function BoardControls({ q, who, sort }: { q: string; who: BuyerType; sort: "status" | "asset" }) {
  const href = (p: { who?: BuyerType; sort?: string }) =>
    `/app/search?${new URLSearchParams({ q, who: p.who ?? who, sort: p.sort ?? sort })}`;
  const pill = (active: boolean) =>
    `flex min-h-9 items-center rounded-full px-4 text-[13px] font-semibold ${active ? "bg-surface shadow-sm" : "text-muted hover:text-ink"}`;
  return (
    <div className="flex flex-wrap gap-2">
      <div role="group" aria-label="Buyer type" className="flex gap-1 rounded-full bg-tint p-1">
        <Link href={href({ who: "citizen" })} aria-current={who === "citizen" ? "true" : undefined} className={pill(who === "citizen")}>Citizens</Link>
        <Link href={href({ who: "foreigner" })} aria-current={who === "foreigner" ? "true" : undefined} className={pill(who === "foreigner")}>Foreigners</Link>
      </div>
      <div role="group" aria-label="Order" className="flex gap-1 rounded-full bg-tint p-1">
        <Link href={href({ sort: "status" })} aria-current={sort === "status" ? "true" : undefined} className={pill(sort === "status")}>By status</Link>
        <Link href={href({ sort: "asset" })} aria-current={sort === "asset" ? "true" : undefined} className={pill(sort === "asset")}>By asset</Link>
      </div>
    </div>
  );
}
