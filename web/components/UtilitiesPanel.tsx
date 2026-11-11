"use client";

import Link from "next/link";
import { useState } from "react";

import { EarnForm } from "@/components/EarnForm";
import { UtilityCard } from "@/components/UtilityCard";
import type { Utilities, UtilityOption } from "@/lib/types";

const button = (enabled: boolean) =>
  `inline-flex min-h-11 w-fit items-center rounded-full px-5 font-semibold ${enabled ? "bg-action text-on-action" : "pointer-events-none bg-field text-muted"}`;

/**
 * The Utilities tab: for each token version of the asset, one card per
 * utility. Trading reuses the existing gated buy flow; earning opens the
 * Meteora panel; lending and borrowing stay disabled until a protocol is
 * sourced. `conditions` are each version's issuer conditions, shown before
 * any acknowledgement.
 */
export function UtilitiesPanel({ data, buyHref, conditions, renderEarn }: {
  data: Utilities;
  buyHref: (tokenSymbol: string) => string;
  conditions: Record<string, string[]>;
  renderEarn?: (version: Utilities["versions"][number], option: UtilityOption, enabled: boolean) => React.ReactNode;
}) {
  const [active, setActive] = useState(0);
  const version = data.versions[active];
  if (!version) return <p className="rounded-card bg-wash p-5 text-sm text-muted">No onchain version of this asset is tracked yet.</p>;

  function renderAction(utility: string, option: UtilityOption, enabled: boolean): React.ReactNode {
    if (utility === "hold") return null;
    if (utility === "trade") {
      return <Link href={buyHref(version.asset.tokenSymbol)} aria-disabled={!enabled} className={button(enabled)}>Trade {version.asset.tokenSymbol}</Link>;
    }
    if (utility === "earn") return renderEarn ? renderEarn(version, option, enabled) : <EarnForm version={version} option={option} enabled={enabled} />;
    return <span className={button(false)} aria-disabled="true">{utility === "lend" ? "Lend" : "Borrow"} (no verified protocol yet)</span>;
  }

  return (
    <section aria-labelledby="utilities-title" className="flex flex-col gap-4">
      <div>
        <h2 id="utilities-title" className="text-[22px] font-bold">What you can do with it</h2>
        <p className="text-sm text-muted">Each utility is judged twice: by the issuer&apos;s rule for holding it here and by the protocol&apos;s own terms. The stricter one decides. Vestail never holds your funds: you sign every transaction.</p>
      </div>
      {data.versions.length > 1 && (
        <div role="tablist" aria-label="Token version" className="flex flex-wrap gap-1 rounded-full bg-tint p-1">
          {data.versions.map((v, i) => (
            <button key={v.asset.id} type="button" role="tab" aria-selected={i === active} onClick={() => setActive(i)}
              className={`min-h-10 rounded-full px-4 text-sm font-semibold ${i === active ? "bg-surface shadow-sm" : "text-muted hover:text-ink"}`}>
              {v.asset.tokenSymbol} <span className="font-normal text-muted">· {v.asset.chain}</span>
            </button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {version.utilities.map(u => (
          <UtilityCard key={`${version.asset.id}-${u.utility}`} utility={u} conditions={conditions[version.asset.id] ?? []} renderAction={(option, enabled) => renderAction(u.utility, option, enabled)} />
        ))}
      </div>
      <p className="text-xs text-muted">{data.disclaimer}</p>
    </section>
  );
}
