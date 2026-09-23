"use client";

import { REGION_IN_SENTENCE, type AllowedRegion, type AllowedSymbol } from "@/lib/constants";
import { PROVIDER_NAME, STRUCTURE_PLAIN } from "@/lib/labels";
import { isSelectable, sortVersions } from "@/lib/app/versions";
import { VERDICT_BADGE as BADGE } from "@/lib/verdictBadge";
import type { VersionVerdict } from "@/lib/types";
import type { EligibilityState } from "@/hooks/useEligibility";

/**
 * Every version of the chosen stock with its verdict for the declared
 * country. Eligible and conditional versions can be chosen; restricted ones
 * are shown, dimmed, and cannot be. Native radio buttons, so arrow keys and
 * screen readers work without extra code.
 */
export function VersionCards({
  state,
  retry,
  symbol,
  region,
  selectedMint,
  onSelect,
  acknowledged,
  onAcknowledge,
}: {
  state: EligibilityState;
  retry: () => void;
  symbol: AllowedSymbol | null;
  region: AllowedRegion | null;
  selectedMint: string | null;
  onSelect: (mint: string) => void;
  acknowledged: boolean;
  onAcknowledge: (value: boolean) => void;
}) {
  if (state.status === "idle" || !symbol || !region) {
    return (
      <p className="rounded-2xl px-5 py-8 text-center text-sm leading-relaxed text-white/60 ring-1 ring-white/10">
        Pick your country and a stock to see which versions you can hold.
      </p>
    );
  }

  if (state.status === "loading") {
    return (
      <div aria-busy="true" aria-label={`Checking versions of ${symbol}`} className="space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="h-28 rounded-2xl bg-white/[0.05] ring-1 ring-white/10 motion-safe:animate-pulse" />
        ))}
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div role="alert" className="rounded-2xl px-5 py-6 text-center ring-1 ring-white/10">
        <p className="text-sm text-white/80">We couldn&apos;t check the versions of {symbol} just now.</p>
        <button
          type="button"
          onClick={retry}
          className="mt-3 rounded-full px-4 py-1.5 text-sm font-semibold text-white ring-1 ring-white/25 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-brand-orange"
        >
          Try again
        </button>
      </div>
    );
  }

  const versions = sortVersions(state.data.versions);
  const noneBuyable = !versions.some(isSelectable);

  return (
    <fieldset>
      <legend className="mb-3 text-base font-semibold text-white">Versions of {symbol} you can get</legend>
      {noneBuyable && (
        <p className="mb-3 rounded-2xl bg-white/[0.05] px-4 py-3 text-sm leading-relaxed text-white/85 ring-1 ring-white/10">
          None of the {versions.length === 1 ? "version" : `${versions.length} versions`} of {symbol} can
          be held in {REGION_IN_SENTENCE[region]} under their issuers&apos; own terms, so Vestail won&apos;t route
          a purchase. Each one below says why.
        </p>
      )}
      <ul className="space-y-3">
        {versions.map((v) => (
          <li key={v.representation.mint}>
            <Card
              version={v}
              region={region}
              selected={v.representation.mint === selectedMint}
              onSelect={onSelect}
            />
            {v.representation.mint === selectedMint && v.verdict?.acknowledgement && (
              <label className="mt-2 flex cursor-pointer items-start gap-3 rounded-2xl bg-conditional/10 px-4 py-3 text-sm leading-relaxed text-white ring-1 ring-conditional/40">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => onAcknowledge(e.target.checked)}
                  className="mt-1 size-4 shrink-0 accent-brand-orange"
                />
                <span>
                  I understand I can buy and hold this, but {v.verdict.acknowledgement.limit} requires{" "}
                  {v.verdict.acknowledgement.requires}.
                </span>
              </label>
            )}
          </li>
        ))}
      </ul>
    </fieldset>
  );
}

function Card({
  version: v,
  region,
  selected,
  onSelect,
}: {
  version: VersionVerdict;
  region: AllowedRegion;
  selected: boolean;
  onSelect: (mint: string) => void;
}) {
  const r = v.representation;
  const status = v.verdict?.status ?? "not_assessed";
  const selectable = isSelectable(v);
  const badge = BADGE[status];
  const reason = v.verdict?.summary ?? `No sourced rule covers ${REGION_IN_SENTENCE[region]} yet, so we make no claim.`;

  return (
    <label
      className={`block rounded-2xl p-4 ring-1 motion-safe:transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-orange ${
        !selectable
          ? "cursor-not-allowed bg-white/[0.02] opacity-60 ring-white/10"
          : selected
            ? "cursor-pointer bg-white/[0.08] ring-2 ring-brand-orange"
            : "cursor-pointer bg-white/[0.04] ring-white/10 hover:bg-white/[0.07]"
      }`}
    >
      <input
        type="radio"
        name="version"
        value={r.mint}
        checked={selected}
        disabled={!selectable}
        onChange={() => onSelect(r.mint)}
        className="sr-only"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-white">
            {PROVIDER_NAME[r.provider]} <span className="font-normal text-white/60">· {r.tokenSymbol}</span>
          </p>
          <p className="mt-0.5 text-sm text-white/70">{STRUCTURE_PLAIN[r.structure]}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${badge.className}`}>
          {badge.label}
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-white/85">{reason}</p>
      {v.verdict && (
        <a
          href={v.verdict.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block text-xs text-white/60 underline underline-offset-4 hover:text-white"
        >
          Source{v.verdict.sourceQuality === "secondary" ? " (secondary: verify before relying on it)" : ""}
        </a>
      )}
    </label>
  );
}
