import "server-only";

import { PrivyClient } from "@privy-io/node";

// Verify bearer tokens before any route acts for a Privy user.

let client: PrivyClient | null = null;
function privy(): PrivyClient {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  if (!appId || !appSecret) throw new Error("Privy is not configured: set NEXT_PUBLIC_PRIVY_APP_ID and PRIVY_APP_SECRET.");
  client ??= new PrivyClient({ appId, appSecret });
  return client;
}

export async function listPrivyUsers(limit = 500) {
  const rows = [];
  for await (const user of privy().users().list()) {
    rows.push(user);
    if (rows.length >= limit) break;
  }
  return rows;
}

export async function userFrom(request: Request): Promise<string | null> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  try {
    const claims = await privy().utils().auth().verifyAccessToken(token);
    return claims.user_id;
  } catch {
    return null;
  }
}

// Privy replaces custom metadata, so preserve unrelated fields on every update.
export async function updateMetadata(userId: string, patch: Record<string, string>) {
  const user = await privy().users()._get(userId);
  const current = (user.custom_metadata ?? {}) as Record<string, string | number | boolean>;
  await privy().users().setCustomMetadata(userId, { custom_metadata: { ...current, ...patch } });
  return current;
}

export async function saveProfileFor(userId: string, profile: { country: string; who: string }) {
  await updateMetadata(userId, { country: profile.country, who: profile.who });
}
