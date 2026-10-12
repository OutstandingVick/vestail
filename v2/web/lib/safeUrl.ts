/**
 * Links that come from data (issuer sources, rule sources, buy redirects) are
 * rendered on pages where people sign. Only https is allowed: a javascript:
 * or data: URL slipped into a data file must never become a clickable link
 * or a navigation. Returns null for anything else, so callers drop the link.
 */
export function safeHttps(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}
