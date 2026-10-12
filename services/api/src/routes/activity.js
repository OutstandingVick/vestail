const RECENT = 10;
const WEEK = 7 * 24 * 3600 * 1000;

const ago = ms => {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 30) return "just now";
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m ago`;
  if (s < 86400) return `${Math.round(s / 3600)}h ago`;
  return `${Math.round(s / 86400)}d ago`;
};

/**
 * GET /activity — HUD stats and recent buys. Recorded clicks come first.
 * The sample figures in data/activity.sample.json are only used when
 * useSample is set; CLAUDE.md forbids shipping them to production, where the
 * stats come from recorded clicks alone. Volume needs order data, so it is 0
 * until a real order store exists.
 */
export function registerActivity(v1, { v, data, clicks, useSample }) {
  const sample = data.raw.activity;
  const flagOf = code => data.countryByCode[code]?.flag || "";

  v.route(v1, "get", "/activity", c => {
    const recorded = clicks.recent(RECENT).map(x => ({
      flag: flagOf(x.country), asset: data.nameById[x.asset], venue: x.venue, ago: ago(clicks.now() - x.at),
    }));
    const stats = useSample
      ? { ...sample.stats, orders_routed: sample.stats.orders_routed + clicks.count() }
      : { volume_30d_usd: 0, volume_30d_delta_pct: 0, orders_routed: clicks.count(), orders_delta_pct: 0, active_buyers_7d: clicks.buyersSince(WEEK) };
    const recent = [...recorded, ...(useSample ? sample.recent : [])].slice(0, RECENT);
    return c.json({ stats, recent });
  });
}
