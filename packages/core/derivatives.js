/**
 * Price exposure that is not ownership: commodity, index, currency and
 * volatility perpetual futures on Hyperliquid.
 *
 * A perpetual is judged by the venue's own rules, never by an underlying
 * ownership rule, because the buyer never holds that underlying. The verdict keeps
 * the three-state scale, and every market carries instrument
 * "perpetual_future" so no screen can show it as owning the underlying.
 *
 *   const d = createDerivatives({ venue: data, policies: [hyperliquidPolicy] });
 *   d.find("oil")                 -> markets whose name or alias matches
 *   d.judge("xyz:GOLD", "NG")     -> { market, instrument, status, issuer, ... }
 */

import { STATUS, norm } from "./index.js";
import { evaluateIssuer } from "./tokens.js";

export function createDerivatives({ venue, policies }) {
  const VENUE = venue.venue;
  const MARKETS = venue.markets;
  const policy = (Array.isArray(policies) ? policies : [policies]).find(p => p.provider === VENUE.name.toLowerCase());
  if (!policy) throw new Error(`derivatives: no policy for ${VENUE.name}`);

  const list = () => MARKETS.map(m => ({ ...m, venue: VENUE.name, chain: VENUE.chain, deployer: VENUE.deployer, instrument: "perpetual_future" }));

  /** Markets a query names: "oil", "crude", "copper", "gold". Whole words only, so "goldman" is not gold. */
  function find(query) {
    const q = norm(query);
    if (!q) return [];
    const words = new Set(q.split(" "));
    return list().filter(m => m.aliases.some(a => q === a || a.split(" ").every(w => words.has(w))));
  }

  /** One market judged for a country. Buyer type does not change a venue's rule. */
  function judge(id, code) {
    const market = list().find(m => m.id === id);
    if (!market) return null;
    const issuer = evaluateIssuer({ provider: policy.provider, symbol: id }, code, policy);
    return {
      ...market, country: code,
      assessed: !!issuer,
      status: issuer ? STATUS[issuer.status] : null,
      issuer: issuer && { ...issuer, status: STATUS[issuer.status] },
    };
  }

  return { venue: VENUE, list, find, judge };
}
