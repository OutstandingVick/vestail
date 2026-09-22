/**
 * Ordering and default choice for the version cards. Pure, with type-only
 * imports, so Node's test runner can load it directly.
 */

import type { Structure, VersionVerdict } from "@/lib/types";

/**
 * Strongest claim first: a real share through a broker, then a token backed
 * by shares in custody, a note tracking the price, a loan repaid on a
 * liquidity event, and exposure through an SPV with no shareholder rights.
 */
const CLAIM_STRENGTH: Record<Structure, number> = {
  security_entitlement: 0,
  custody_backed: 1,
  total_return_note: 2,
  loan_participation: 3,
  spv_exposure: 4,
};

const STATUS_ORDER = { eligible: 0, conditional: 1, restricted: 2, not_assessed: 3 };

function statusOf(v: VersionVerdict) {
  return v.verdict?.status ?? "not_assessed";
}

/** Cards in display order: eligible, conditional, then the ones you cannot buy. */
export function sortVersions(versions: VersionVerdict[]): VersionVerdict[] {
  return versions
    .map((v, i) => ({ v, i }))
    .sort(
      (a, b) =>
        STATUS_ORDER[statusOf(a.v)] - STATUS_ORDER[statusOf(b.v)] ||
        CLAIM_STRENGTH[a.v.representation.structure] - CLAIM_STRENGTH[b.v.representation.structure] ||
        a.i - b.i,
    )
    .map(({ v }) => v);
}

/**
 * The version to select for the buyer: the eligible one with the strongest
 * claim. Never a conditional one, which needs a deliberate choice and an
 * acknowledgement, and never a restricted one. Null if nothing is eligible.
 */
export function defaultVersion(versions: VersionVerdict[]): string | null {
  const best = sortVersions(versions).find((v) => statusOf(v) === "eligible");
  return best ? best.representation.mint : null;
}

/** Whether a version can be selected at all. */
export function isSelectable(v: VersionVerdict): boolean {
  const s = statusOf(v);
  return s === "eligible" || s === "conditional";
}
