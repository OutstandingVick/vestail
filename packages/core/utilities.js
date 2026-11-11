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

/**
 * One protocol's verdict for a country, from its rule file. The strictest rule
 * naming the country decides. No rule naming it (or a placeholder file with no
 * rules) means unverified: missing research is not permission.
 */
export function evaluateProtocol(protocol, country) {
  const base = { protocol: protocol.protocol, name: protocol.name, version: protocol.version, verifiedOn: protocol.verifiedOn ?? null };
  const matching = (protocol.rules || []).filter(r => r.regions.includes(country));
  if (!matching.length) {
    return {
      ...base, verdict: "unverified", sources: [],
      reasons: [protocol.todo
        ? `${protocol.name} has no sourced rules in Vestail yet.`
        : `${protocol.name}'s terms haven't been checked for this country.`],
    };
  }
  const verdict = mostRestrictive(...matching.map(r => r.status));
  const deciding = matching.filter(r => r.status === verdict);
  return {
    ...base, verdict,
    reasons: deciding.map(r => r.reason),
    sources: [...new Map(deciding.map(r => [r.sourceUrl, { label: `${protocol.name} terms`, url: r.sourceUrl, quality: r.sourceQuality }])).values()],
    acknowledgement: deciding.find(r => r.acknowledgement)?.acknowledgement ?? null,
  };
}

/** The only utilities Vestail offers. Spot only: no perpetuals, leverage or margin. */
export const UTILITIES = ["hold", "trade", "lend", "borrow", "earn"];
const CONFIGURABLE = ["trade", "lend", "borrow", "earn"];
const FORBIDDEN = /perp|leverage|margin|futures/i;
/** Utilities that need the buyer to acknowledge a risk before any transaction. */
export const RISK = { lend: "liquidation", borrow: "liquidation", earn: "impermanent_loss" };

/**
 * Read support.json: which protocols offer which utility for which assets.
 * Refuses anything that isn't a spot utility, and any protocol without a
 * rule file, at load time, so a misconfiguration fails loudly.
 */
export function readSupport(support, protocols) {
  const utilities = support.utilities || {};
  for (const key of Object.keys(utilities)) {
    if (FORBIDDEN.test(key) || !CONFIGURABLE.includes(key)) throw new Error(`utilities: "${key}" is not a supported utility (spot only: ${CONFIGURABLE.join(", ")})`);
    for (const entry of utilities[key]) {
      if (!protocols[entry.protocol]) throw new Error(`utilities: no rule file for protocol ${entry.protocol}`);
      if (FORBIDDEN.test(entry.action || "")) throw new Error(`utilities: ${entry.protocol} ${key} action "${entry.action}" is not spot`);
    }
  }
  /** Support entries for a utility that cover this token (by chain and address). */
  return (utility, token) => (utilities[utility] || []).filter(e =>
    e.chains.includes(token.chain) && (e.assets === "*" || e.assets.includes(token.address)));
}
