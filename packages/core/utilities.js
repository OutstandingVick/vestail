/**
 * Utilities: what a holder may do with an asset beyond holding it, and
 * whether they're allowed to. Each utility's verdict combines the asset's hold
 * verdict with the protocol's own sourced restrictions; the most restrictive
 * wins. Data is injected: protocol rule files and the support config.
 */

/** The public verdict scale, most restrictive first. */
export const VERDICTS = ["restricted", "unverified", "conditional", "eligible"];

/** The most restrictive of any number of verdicts. No inputs means unverified. */
export function mostRestrictive(...verdicts) {
  const ranked = verdicts.filter(Boolean).map(v => {
    const i = VERDICTS.indexOf(v);
    if (i < 0) throw new Error(`utilities: unknown verdict ${v}`);
    return i;
  });
  return ranked.length ? VERDICTS[Math.min(...ranked)] : "unverified";
}

/** The app's hold status (can_own / conditional / cannot_own / null) on the public scale. */
export const HOLD_VERDICT = { can_own: "eligible", conditional: "conditional", cannot_own: "restricted" };
export const holdVerdict = status => (status ? HOLD_VERDICT[status] ?? "unverified" : "unverified");
