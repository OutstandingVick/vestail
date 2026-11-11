/**
 * A small time-bounded cache for live market reads, so a page of utilities
 * doesn't hit Jupiter and Meteora once per request. Failures aren't cached,
 * and concurrent misses for the same key share one fetch.
 */
export function createLiveCache({ ttlMs = 30_000, now = () => Date.now(), max = 500 } = {}) {
  const entries = new Map();
  return async function cached(key, load) {
    const hit = entries.get(key);
    if (hit && hit.expires > now()) return hit.value;
    const value = load();
    entries.set(key, { value, expires: now() + ttlMs });
    if (entries.size > max) entries.delete(entries.keys().next().value);
    try {
      return await value;
    } catch (e) {
      entries.delete(key);
      throw e;
    }
  };
}
