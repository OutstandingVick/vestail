import { NextResponse } from "next/server";
import { z } from "zod";

import { api } from "@/lib/server/api";
import { userFrom } from "@/lib/server/privy";
import { readUser, writeUser } from "@/lib/server/store";

/** POST /api/watchlist { asset, symbol?, on } — add or remove an asset (or one ticker under it). */
const Body = z.object({ asset: z.string().min(1).max(64), symbol: z.string().max(12).optional(), on: z.boolean() });

export async function POST(request: Request) {
  const userId = await userFrom(request);
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid watchlist change." }, { status: 400 });
  const { asset, symbol, on } = parsed.data;
  if (!(await api.assets()).some(a => a.id === asset)) return NextResponse.json({ error: "Unknown asset." }, { status: 400 });

  const data = await readUser(userId);
  const same = (w: { asset: string; symbol?: string }) => w.asset === asset && (w.symbol ?? null) === (symbol ?? null);
  const watchlist = data.watchlist.filter(w => !same(w));
  if (on) watchlist.unshift({ asset, ...(symbol ? { symbol } : {}), added: new Date().toISOString() });
  await writeUser(userId, { ...data, watchlist: watchlist.slice(0, 50) });
  return NextResponse.json({ watching: on });
}

/** GET /api/watchlist — the user's watched items, for the Watch buttons. */
export async function GET(request: Request) {
  const userId = await userFrom(request);
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  return NextResponse.json((await readUser(userId)).watchlist);
}
