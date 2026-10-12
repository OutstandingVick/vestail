import { NextResponse } from "next/server";
import { z } from "zod";

import { api, ApiError } from "@/lib/server/api";
import { userFrom } from "@/lib/server/privy";
import { readProfile } from "@/lib/server/profile";

/**
 * POST /api/order/market { market, acknowledged } — route the buyer to a
 * Hyperliquid commodity market on trade.xyz. Price exposure, not ownership:
 * the venue's verdict is re-read for the declared country, cannot-own and not
 * assessed are refused, and conditional needs the acknowledgement. The API
 * records the click and checks all of it again.
 */
const Body = z.object({ market: z.string().regex(/^[a-z]+:[A-Z0-9]+$/), acknowledged: z.boolean().optional() });
const fail = (status: number, error: string) => NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const userId = await userFrom(request);
  if (!userId) return fail(401, "Sign in first.");
  const profile = await readProfile();
  if (!profile) return fail(400, "Choose your country first.");
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "Invalid order.");
  const { market, acknowledged } = parsed.data;
  try {
    const m = await api.derivative(market, profile.country);
    if (!m.assessed) return fail(403, "This market hasn't been assessed for your country, so Vestail doesn't route it.");
    if (m.status === "cannot_own") return fail(403, "This market isn't available in your declared country.");
    if (m.status === "conditional" && acknowledged !== true) return fail(403, "Acknowledge that this is price exposure only first.");
    const { redirect } = await api.click({
      country: profile.country, asset: market, market, who: profile.who, venue: "Hyperliquid", session: userId,
      acknowledged: m.status === "conditional" ? true : undefined,
    });
    return NextResponse.json({ redirect }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof ApiError) return fail(e.status >= 500 ? 502 : 403, e.message);
    throw e;
  }
}
