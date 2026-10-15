import { NextResponse } from "next/server";

import { userFrom } from "@/lib/server/privy";
import { readProfile } from "@/lib/server/profile";
import { loadWatchlist } from "@/lib/server/watchlist";

/** GET /api/watchlist/summary — saved choices with verdicts and live performance. */
export async function GET(request: Request) {
  const userId = await userFrom(request);
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const profile = await readProfile();
  if (!profile) return NextResponse.json({ error: "Choose your country first." }, { status: 400 });
  return NextResponse.json(await loadWatchlist(userId, profile), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
