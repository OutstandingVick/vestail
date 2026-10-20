import { NextResponse } from "next/server";
import { z } from "zod";

import { api, ApiError } from "@/lib/server/api";
import { userFrom } from "@/lib/server/privy";
import { readProfile } from "@/lib/server/profile";

/**
 * POST /api/order/click { asset, venue, acknowledged } — a Buy press on a
 * venue. This is where the order is built, so this is where the rules are
 * checked: the rule is re-read for the buyer's declared country and type
 * (never taken from the browser), cannot-own is refused, and conditional needs
 * acknowledged: true. The API checks all of it again when the click is recorded.
 */
const Body = z.object({ asset: z.string().min(1).max(64), venue: z.string().min(1).max(80), acknowledged: z.boolean().optional(), query: z.string().max(200).optional() });

const fail = (status: number, error: string) => NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const userId = await userFrom(request);
  if (!userId) return fail(401, "Sign in first.");
  const profile = await readProfile();
  if (!profile) return fail(400, "Choose your country first.");
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "Invalid order.");
  const { asset, venue, acknowledged, query } = parsed.data;

  try {
    const rule = await api.rule(profile.country, asset, profile.who);
    if (rule.status === "cannot_own") return fail(403, "This can't be owned in your declared country, so Vestail doesn't route it.");
    if (rule.status === "conditional" && acknowledged !== true) return fail(403, "Acknowledge the condition before buying.");
    const { redirect } = await api.click({
      country: profile.country, asset, who: profile.who, venue, query, session: userId,
      acknowledged: rule.status === "conditional" ? true : undefined,
    });
    return NextResponse.json({ redirect }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof ApiError) return fail(e.status >= 500 ? 502 : 403, e.message);
    throw e;
  }
}
