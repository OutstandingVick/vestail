import { appendFileSync, existsSync, readFileSync } from "node:fs";

export function createClickLog({ now = () => Date.now(), file = null } = {}) {
  const clicks = file && existsSync(file)
    ? readFileSync(file, "utf8").split("\n").filter(Boolean).map(line => JSON.parse(line))
    : [];
  let seq = clicks.length;

  return {
    record(event) {
      const click = { id: `clk_${now().toString(36)}_${(++seq).toString(36)}`, at: now(), ...event };
      clicks.push(click);
      if (file) appendFileSync(file, JSON.stringify(click) + "\n");
      return click;
    },
    recent(limit) { return clicks.slice(-limit).reverse(); },
    bySession(session, partner, limit) {
      return clicks.filter(c => c.session === session && c.partner === partner).slice(-limit).reverse();
    },
    count() { return clicks.length; },
    buyersSince(ms) {
      const since = now() - ms;
      return new Set(clicks.filter(c => c.at >= since).map(c => c.session).filter(Boolean)).size;
    },
    now,
  };
}
