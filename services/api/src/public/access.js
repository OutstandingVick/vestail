import { errorBody } from "../errors.js";

const bearer = header => /^Bearer\s+(.+)$/i.exec(header || "")?.[1]?.trim() || null;

export function partnerAccess({ store, windowMs = 60_000, now = () => Date.now() }) {
  const windows = new Map();
  return async (c, next) => {
    if (c.req.method === "OPTIONS" || c.req.path.endsWith("/openapi.json")) return next();
    const key = await store.authenticate(bearer(c.req.header("Authorization")));
    if (!key) return c.json(errorBody("unauthorized", "A valid API key is required in Authorization: Bearer <key>."), 401);

    const time = now();
    let window = windows.get(key.id);
    if (!window || time >= window.reset) {
      window = { count: 0, reset: time + windowMs };
      windows.set(key.id, window);
    }
    window.count += 1;
    const retryAfter = Math.max(1, Math.ceil((window.reset - time) / 1000));
    if (window.count > key.rateLimit) {
      c.header("Retry-After", String(retryAfter));
      return c.json(errorBody("rate_limited", `Rate limit exceeded. Retry in ${retryAfter} seconds.`), 429);
    }

    c.set("partnerKey", key);
    await store.countUsage(key.id, new Date(time));
    await next();
    c.res.headers.set("RateLimit-Limit", String(key.rateLimit));
    c.res.headers.set("RateLimit-Remaining", String(Math.max(0, key.rateLimit - window.count)));
    c.res.headers.set("RateLimit-Reset", String(Math.ceil(window.reset / 1000)));
  };
}
