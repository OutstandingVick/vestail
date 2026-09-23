import { REGION_FLAG, REGION_NAME, REGION_ALLOWLIST } from "@/lib/constants";
import { PROVIDER_NAME } from "@/lib/labels";
import { POLICIES } from "@/lib/policies";
import { evaluate } from "@/lib/evaluate";
import { getSymbolEntry } from "@/lib/registry";
import { VERDICT_BADGE, type BadgeStatus } from "@/lib/verdictBadge";
import type { AllowedSymbol } from "@/lib/constants";

/**
 * Every version of one symbol, judged in every country Vestail covers.
 *
 * Computed at build time by the same evaluator the app and the tests use,
 * from the same policy files — not transcribed. A hand-written grid in a
 * document about sourced claims would be the one unsourced claim on the
 * page.
 */
export function VerdictGrid({ symbol }: { symbol: AllowedSymbol }) {
  const versions = getSymbolEntry(symbol).representations;

  return (
    <div className="space-y-px overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10">
      {versions.map((representation) => (
        <div key={representation.mint} className="bg-brand-navy/80 p-4">
          <p className="font-bold text-white">
            {PROVIDER_NAME[representation.provider]}
            <span className="ml-2 font-normal text-white/45">
              {representation.tokenSymbol}
            </span>
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-3">
            {REGION_ALLOWLIST.map((region) => {
              const verdict = evaluate(
                representation,
                region,
                POLICIES[representation.provider],
              );
              const status: BadgeStatus = verdict?.status ?? "not_assessed";
              const badge = VERDICT_BADGE[status];
              return (
                <li key={region} className="rounded-xl bg-white/[0.04] p-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-white/40">
                    <span aria-hidden>{REGION_FLAG[region]} </span>
                    {REGION_NAME[region]}
                  </p>
                  <span
                    className={`mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                  <p className="mt-2 text-xs leading-snug text-white/60">
                    {verdict?.summary ?? "No researched rule covers this yet."}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
