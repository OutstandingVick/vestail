import { appendFileSync, existsSync, readFileSync } from "node:fs";

/**
 * The click log: every Buy press, for /activity, the attribution ledger and a
 * buyer's own order history.
 *
 * With `file` set (VESTAIL_CLICKS_FILE), clicks are appended to it as JSON
 * lines and reloaded on start, so they survive a restart. It is still one
 * process's file: a single API instance only, until a shared store replaces it.
 * Without `file` it is in memory, as the tests use it.
 */
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
    /** One buyer's presses, newest first, only those recorded through the same partner key. */
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
