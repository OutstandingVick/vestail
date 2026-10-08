import "server-only";

import { PrivyClient } from "@privy-io/node";

/**
 * Server-side Privy. The browser sends its Privy access token as a bearer
 * header; every route that acts for a user (saving a profile, recording a buy,
 * building a swap) verifies it here first.
 */

let client: PrivyClient | null = null;
function privy(): PrivyClient {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  if (!appId || !appSecret) throw new Error("Privy is not configured: set NEXT_PUBLIC_PRIVY_APP_ID and PRIVY_APP_SECRET.");
  client ??= new PrivyClient({ appId, appSecret });
  return client;
}

/** The signed-in user's id, or null when the request carries no valid token. */
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

/**
 * Merge fields into the Privy user's custom metadata. Privy replaces the whole
 * object on every save, so read it first: changing country must not erase the
 * user's name, and the reverse.
 */
export async function updateMetadata(userId: string, patch: Record<string, string>) {
  const user = await privy().users()._get(userId);
  const current = (user.custom_metadata ?? {}) as Record<string, string | number | boolean>;
  await privy().users().setCustomMetadata(userId, { custom_metadata: { ...current, ...patch } });
}

/** Store the self-declared profile on the Privy user, so it follows them across devices. */
export async function saveProfileFor(userId: string, profile: { country: string; who: string }) {
  await updateMetadata(userId, { country: profile.country, who: profile.who });
}
