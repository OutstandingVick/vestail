import "server-only";

/**
 * Upstash/Vercel KV over its REST API, as a Redis command array.
 *
 * Returns null when KV is not configured, which is the signal to fall back to
 * local files: that is how development works without an account, and it is
 * deliberately not an error. A configured-but-failing KV does throw, because
 * silently writing to a disk that will be discarded is worse than a 500.
 */
export async function kvCommand(
  command: string[],
  unavailable: string,
): Promise<{ result: unknown } | null> {
  const url = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;

  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(unavailable);
  return response.json() as Promise<{ result: unknown }>;
}

/** True when KV is configured, i.e. when the local-file fallback will not be used. */
export const kvConfigured = () =>
  Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
