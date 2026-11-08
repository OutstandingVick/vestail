import "server-only";

import { cookies } from "next/headers";
import { BUYER_TYPES, type BuyerType, type Profile } from "@/lib/types";

// The buyer declares this profile; never infer it from network or locale.
export const PROFILE_COOKIE = "vestail_profile";

export function parseProfile(raw: string | undefined | null): Profile | null {
  const [country, who] = (raw ?? "").split(":");
  if (!/^[A-Z]{2}$/.test(country ?? "") || !BUYER_TYPES.includes(who as BuyerType)) return null;
  return { country, who: who as BuyerType };
}

export async function readProfile(): Promise<Profile | null> {
  return parseProfile((await cookies()).get(PROFILE_COOKIE)?.value);
}
