"use client";

import { useState } from "react";

import { RiskAcknowledgement } from "@/components/RiskAcknowledgement";
import { UtilityVerdictBadge } from "@/components/UtilityVerdictBadge";
import { safeHttps } from "@/lib/safeUrl";
import type { Utility, UtilityOption } from "@/lib/types";
import { blockedReason, canAct, UTILITY_LABEL } from "@/lib/utilities";

const usd = (n: number | null | undefined) => (n == null ? "—" : n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: n < 10 ? 2 : 0 }));
const pct = (n: number | null | undefined, d = 2) => (n == null ? "—" : `${n.toFixed(d)}%`);

/** The few numbers that matter for each utility, from the option's live data. */
function KeyNumbers({ utility, option }: { utility: Utility["utility"]; option: UtilityOption }) {
  if (option.liveError) return <p className="text-xs text-muted">Live numbers unavailable: {option.liveError}</p>;
  const live = option.live;
  if (!live) return null;
  if (utility === "trade" && live.pairs) {
    return (
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        {live.pairs.map(p => (
          <div key={p.pair} className="contents">
            <dt className="text-muted">{p.pair} pair</dt>
            <dd className="text-right">{p.available
              ? `${p.pair === "USDC" ? usd(p.pricePerToken) : `${p.pricePerToken?.toFixed(4)} SOL`} · impact ${pct(p.priceImpactPct)}`
              : p.note}</dd>
          </div>
        ))}
        {live.pairs.some(p => p.venues?.length) && (
          <><dt className="text-muted">Venues</dt><dd className="text-right">{[...new Set(live.pairs.flatMap(p => p.venues ?? []))].join(", ")}</dd></>
        )}
      </dl>
    );
  }
  if (utility === "earn" && live.pools) {
    const best = live.pools[0];
    return (
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <dt className="text-muted">Liquidity depth</dt><dd className="text-right font-semibold">{usd(live.depthUsd)}</dd>
        <dt className="text-muted">USDC/SOL pools</dt><dd className="text-right">{live.pools.length}</dd>
        {best && <><dt className="text-muted">Deepest pool</dt><dd className="text-right">{best.name} · {best.kind === "dlmm" ? "DLMM" : "DAMM v2"}</dd>
          <dt className="text-muted">Its fee APR (24h, simple)</dt><dd className="text-right">{pct(best.feeAprPct, 1)}</dd></>}
      </dl>
    );
  }
  return null;
}

/**
 * One utility on the asset page: its verdict, key numbers, sources and the
 * action. The action renders only through canAct, so an unverified or
 * restricted option, or a risky one not yet acknowledged, can't start.
 */
export function UtilityCard({ utility, conditions, renderAction }: {
  utility: Utility;
  conditions: string[];
  renderAction?: (option: UtilityOption, enabled: boolean) => React.ReactNode;
}) {
  const [ack, setAck] = useState(false);
  const label = UTILITY_LABEL[utility.utility];
  const option = [...utility.options].sort((a, b) => Number(b.actionsEnabled) - Number(a.actionsEnabled))[0];
  const enabled = option ? canAct(option, ack) : false;
  const blocked = option ? blockedReason(option, ack) : null;
  const sources = option?.sources.filter(s => safeHttps(s.url)) ?? [];

  return (
    <article aria-label={label.title} className="flex flex-col gap-3 rounded-card border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold">{label.title}</h3>
          <p className="text-sm text-muted">{label.blurb}{option ? ` Via ${option.name}.` : ""}</p>
        </div>
        <UtilityVerdictBadge verdict={utility.verdict} />
      </div>

      {option && <KeyNumbers utility={utility.utility} option={option} />}
      <ul className="flex flex-col gap-1 text-sm text-muted">
        {(option?.reasons ?? utility.reasons ?? []).slice(0, 2).map(r => <li key={r}>{r}</li>)}
      </ul>
      {sources.length > 0 && (
        <p className="text-xs text-muted">
          Source: {sources.map((s, i) => <span key={s.url}>{i > 0 && ", "}<a href={safeHttps(s.url)!} target="_blank" rel="noopener noreferrer" className="text-emphasis underline">{s.label}</a></span>)}
          {option?.verifiedOn && <> · checked {option.verifiedOn}</>}
        </p>
      )}

      {option?.actionsEnabled && option.acknowledgementRequired && (
        <RiskAcknowledgement id={`ack-${utility.utility}`} risk={option.risk} conditions={option.verdict === "conditional" ? conditions : []} checked={ack} onChange={setAck} />
      )}
      {option && renderAction?.(option, enabled)}
      {blocked && <p className="text-xs text-muted" role="status">{blocked}</p>}
    </article>
  );
}
