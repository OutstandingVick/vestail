import "server-only";

import { cookies } from "next/headers";
import { BUYER_TYPES, type BuyerType, type Profile } from "@/lib/types";

/**
 * The buyer's self-declared country and buyer type. Never inferred: no IP
 * lookup, no Accept-Language guess. Until they choose, there is no profile and
 * the app asks rather than assumes.
 *
 * Kept in a cookie so server components render the right verdicts on first
 * load; the same values are mirrored to the Privy user (see /api/profile).
 */
export const PROFILE_COOKIE = "vestail_profile";

export function parseProfile(raw: string | undefined | null): Profile | null {
  const [country, who] = (raw ?? "").split(":");
  if (!/^[A-Z]{2}$/.test(country ?? "") || !BUYER_TYPES.includes(who as BuyerType)) return null;
  return { country, who: who as BuyerType };
}

export async function readProfile(): Promise<Profile | null> {
  return parseProfile((await cookies()).get(PROFILE_COOKIE)?.value);
}
