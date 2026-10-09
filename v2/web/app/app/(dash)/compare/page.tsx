import Link from "next/link";

import { VerdictBadge } from "@/components/VerdictBadge";
import { api } from "@/lib/server/api";
import { readProfile } from "@/lib/server/profile";
import { BUYER_TYPES, type BuyerType } from "@/lib/types";

/**
 * One asset class across every country, most open first. The buyer type can be
 * switched here without changing the buyer's own declared profile.
 */
export default async function ComparePage({ searchParams }: { searchParams: Promise<{ asset?: string; who?: string }> }) {
  const sp = await searchParams;
  const [profile, assets] = await Promise.all([readProfile(), api.assets()]);
  const asset = assets.find(a => a.id === sp.asset) ?? assets.find(a => a.id === "foreign_equities")!;
  const who: BuyerType = BUYER_TYPES.includes(sp.who as BuyerType) ? (sp.who as BuyerType) : profile?.who ?? "citizen";
  const matrix = await api.matrix({ q: asset.name, who, sort: "status" });
  const href = (p: { asset?: string; who?: string }) => `/app/compare?asset=${p.asset ?? asset.id}&who=${p.who ?? who}`;

  return (
    <div className="mt-8 flex flex-col gap-4">
      <h1 className="text-[32px] font-extrabold tracking-[-0.02em]">Compare across countries</h1>
      <div className="flex flex-col gap-4 rounded-panel bg-surface p-6">
        <form action="/app/compare" className="flex flex-wrap items-center gap-2.5">
          <label htmlFor="asset" className="sr-only">Asset class</label>
          <select id="asset" name="asset" defaultValue={asset.id} className="min-h-11 rounded-full border-[1.5px] border-field bg-surface px-3.5">
            {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <input type="hidden" name="who" value={who} />
          <button type="submit" className="min-h-11 rounded-full bg-action px-5 font-semibold text-on-action">Compare</button>
          <div role="group" aria-label="Buyer type" className="flex gap-1 rounded-full bg-tint p-1">
            {BUYER_TYPES.map(w => (
              <Link key={w} href={href({ who: w })} aria-current={w === who ? "true" : undefined}
                className={`flex min-h-10 items-center rounded-full px-4 text-[15px] font-semibold capitalize ${w === who ? "bg-ink text-on-ink" : ""}`}>
                {w}s
              </Link>
            ))}
          </div>
        </form>
        <p className="text-sm text-muted">{asset.name}, for {who}s, most open first.</p>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2.5">
          {matrix.rows.map(r => {
            const cell = r.cells[0];
            const mine = r.code === profile?.country;
            return (
              <li key={r.code} className={`flex items-center justify-between gap-2 rounded-xl px-3.5 py-3 ${mine ? "bg-tint ring-2 ring-field" : "bg-wash"}`}>
                <span className="text-[15px]">{r.flag} {r.name}{mine && <span className="sr-only"> (your country)</span>}</span>
                {cell && <VerdictBadge status={cell.status} />}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
