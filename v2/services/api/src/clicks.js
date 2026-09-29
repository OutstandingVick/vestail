/**
 * In-memory click log. It feeds /activity and is the attribution ledger until
 * a real order store replaces it; it does not survive a restart.
 */
export function createClickLog({ now = () => Date.now() } = {}) {
  const clicks = [];
  let seq = 0;

  return {
    record(event) {
      const click = { id: `clk_${now().toString(36)}_${(++seq).toString(36)}`, at: now(), ...event };
      clicks.push(click);
      return click;
    },
    recent(limit) { return clicks.slice(-limit).reverse(); },
    count() { return clicks.length; },
    buyersSince(ms) {
      const since = now() - ms;
      return new Set(clicks.filter(c => c.at >= since).map(c => c.session).filter(Boolean)).size;
    },
    now,
  };
}
