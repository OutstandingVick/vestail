import { getConnInfo } from "@hono/node-server/conninfo";
import { errorBody } from "./errors.js";

/** Client IP: X-Forwarded-For only behind a trusted proxy, else the socket address. */
export const ipFrom = ({ trustProxy = process.env.OWN_TRUST_PROXY === "1" } = {}) => c => {
  if (trustProxy) {
    const fwd = c.req.header("X-Forwarded-For");
    if (fwd) return fwd.split(",")[0].trim();
  }
  try { return getConnInfo(c).remote.address || "unknown"; } catch { return "unknown"; }
};

/**
 * Fixed-window limit on public reads, per IP, in memory. API.md: "Public read
 * for reference and matrix endpoints, rate-limited by IP."
 */
export function rateLimit({ limit = 120, windowMs = 60_000, ipOf = ipFrom(), now = () => Date.now() } = {}) {
  const hits = new Map();
  return async (c, next) => {
    if (c.req.method !== "GET") return next();
    const t = now(), ip = ipOf(c);
    let w = hits.get(ip);
    if (!w || t >= w.reset) {
      if (hits.size > 10_000) for (const [k, v] of hits) if (t >= v.reset) hits.delete(k);
      w = { count: 0, reset: t + windowMs };
      hits.set(ip, w);
    }
    w.count++;
    const retry = Math.ceil((w.reset - t) / 1000);
    if (w.count > limit) {
      c.header("Retry-After", String(retry));
      return c.json(errorBody("rate_limited", `Too many requests. Try again in ${retry}s.`), 429);
    }
    await next();
    c.res.headers.set("RateLimit-Limit", String(limit));
    c.res.headers.set("RateLimit-Remaining", String(limit - w.count));
  };
}
