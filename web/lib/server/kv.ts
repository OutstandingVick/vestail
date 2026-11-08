import "server-only";

// Missing KV config enables local development; a configured KV failure must throw.
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

export const kvConfigured = () =>
  Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
