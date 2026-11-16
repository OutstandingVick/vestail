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
