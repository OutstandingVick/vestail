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

/** Store the self-declared profile on the Privy user, so it follows them across devices. */
export async function saveProfileFor(userId: string, profile: { country: string; who: string }) {
  await privy().users().setCustomMetadata(userId, { custom_metadata: { country: profile.country, who: profile.who } });
}
