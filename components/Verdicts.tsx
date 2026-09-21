"use client";

import { REGION_ALLOWLIST, REGION_NAME, type AllowedRegion } from "@/lib/constants";
import type { Verdict, VerdictStatus } from "@/lib/types";

/**
 * Verdict UI. The only place the verdict colours are used, and they are used
 * for nothing else.
 */

const STATUS_LABEL: Record<VerdictStatus, string> = {
  eligible: "Eligible",
  conditional: "Conditional",
  restricted: "Restricted",
};

/** One-line gloss so the three words are never read as a scale of "okay". */
const STATUS_GLOSS: Record<VerdictStatus, string> = {
  eligible: "The issuer's terms let you hold it and use its rights.",
  conditional:
    "You can buy it, but redemption, dividends or transfer sit behind a gate.",
  restricted: "The issuer's own terms exclude your jurisdiction.",
};

const STATUS_CLASS: Record<VerdictStatus, string> = {
  eligible: "border-eligible text-eligible",
  conditional: "border-conditional text-conditional",
  restricted: "border-restricted text-restricted",
};

const STATUS_BAR: Record<VerdictStatus, string> = {
  eligible: "border-l-eligible",
  conditional: "border-l-conditional",
  restricted: "border-l-restricted",
};

export function RegionPicker({
  region,
  onChange,
}: {
  region: AllowedRegion | null;
  onChange: (region: AllowedRegion) => void;
}) {
  return (
    <div>
      <div role="group" aria-label="Your jurisdiction" className="flex flex-wrap gap-2">
        {REGION_ALLOWLIST.map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={r === region}
            onClick={() => onChange(r)}
            className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
              r === region
                ? "border-gold bg-surface text-paper"
                : "border-line text-dim hover:border-dim hover:text-paper"
            }`}
          >
            {REGION_NAME[r]}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs leading-relaxed text-dim">
        Self-declared. Vestail does not check where you are and blocks nothing;
        it shows what each issuer&apos;s own terms say about your jurisdiction.
      </p>
    </div>
  );
}

/** "1 eligible · 3 conditional · 1 restricted" for the declared region. */
export function VerdictSummary({
  verdicts,
  region,
}: {
  verdicts: Array<Verdict | null>;
  region: AllowedRegion;
}) {
  const count = (s: VerdictStatus) => verdicts.filter((v) => v?.status === s).length;
  const unassessed = verdicts.filter((v) => v === null).length;
  const parts: Array<[string, string]> = [
    [`${count("eligible")} eligible`, "text-eligible"],
    [`${count("conditional")} conditional`, "text-conditional"],
    [`${count("restricted")} restricted`, "text-restricted"],
  ];

  return (
    <p className="text-sm text-dim">
      In {REGION_NAME[region]}:{" "}
      {parts.map(([text, cls], i) => (
        <span key={text}>
          {i > 0 && " · "}
          <span className={cls}>{text}</span>
        </span>
      ))}
      {unassessed > 0 && ` · ${unassessed} not assessed`}
    </p>
  );
}

/**
 * The verdict strip under a token row: status, the deciding reason, and the
 * full evidence behind a disclosure.
 */
export function VerdictStrip({
  verdict,
  region,
  canFreeze,
}: {
  verdict: Verdict | null;
  region: AllowedRegion;
  canFreeze: boolean;
}) {
  if (verdict === null) {
    return (
      <div className="border-l-2 border-l-line pl-4 text-sm text-dim">
        Not assessed for {REGION_NAME[region]}: no sourced rule yet, so Vestail
        makes no claim either way.
      </div>
    );
  }

  const [lead, ...rest] = verdict.evidence;

  return (
    <div className={`border-l-2 pl-4 ${STATUS_BAR[verdict.status]}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span
          className={`rounded border px-2 py-0.5 text-xs font-medium uppercase tracking-wider ${STATUS_CLASS[verdict.status]}`}
        >
          {STATUS_LABEL[verdict.status]}
        </span>
        <span className="text-xs text-dim">{STATUS_GLOSS[verdict.status]}</span>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-paper">
        {lead.reason}{" "}
        <SourceLink url={lead.sourceUrl} secondary={lead.sourceQuality === "secondary"} />
      </p>

      {(rest.length > 0 || canFreeze) && (
        <details className="group mt-2">
          <summary className="cursor-pointer text-xs text-dim underline-offset-4 hover:text-paper hover:underline">
            {rest.length + (canFreeze ? 1 : 0)} more{" "}
            {rest.length + (canFreeze ? 1 : 0) === 1 ? "thing" : "things"} to know
          </summary>
          <ul className="mt-2 space-y-2">
            {rest.map((e) => (
              <li key={e.ruleId} className="text-xs leading-relaxed text-dim">
                {e.reason}{" "}
                <SourceLink url={e.sourceUrl} secondary={e.sourceQuality === "secondary"} />
              </li>
            ))}
            {canFreeze && (
              <li className="text-xs leading-relaxed text-dim">
                The token has a freeze authority set onchain: the issuer can
                freeze any holder&apos;s balance.
              </li>
            )}
          </ul>
        </details>
      )}

      <p className="mt-2 text-[11px] text-dim">
        Policy {verdict.provider} v{verdict.policyVersion}
        {verdict.sourceQuality === "secondary" &&
          " · Rests on a secondary source or an inference; verify before relying on it."}
      </p>
    </div>
  );
}

function SourceLink({ url, secondary }: { url: string; secondary: boolean }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="whitespace-nowrap text-xs text-dim underline underline-offset-4 hover:text-paper"
    >
      {secondary ? "Source (secondary)" : "Source"}
    </a>
  );
}
