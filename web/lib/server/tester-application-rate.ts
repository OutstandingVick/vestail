const attempts = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 6;

export function testerApplicationRateAllowed(ip: string, now = Date.now()): boolean {
  const recent = (attempts.get(ip) ?? []).filter(at => now - at < WINDOW_MS);
  if (recent.length >= LIMIT) return false;
  recent.push(now);
  attempts.set(ip, recent);
  return true;
}

export function resetTesterApplicationRates() { attempts.clear(); }
