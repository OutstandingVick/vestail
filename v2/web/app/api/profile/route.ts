import { NextResponse } from "next/server";
import { z } from "zod";

import { api } from "@/lib/server/api";
import { saveProfileFor, userFrom } from "@/lib/server/privy";
import { PROFILE_COOKIE } from "@/lib/server/profile";

/**
 * POST /api/profile { country, who } — the buyer declares (or changes) their
 * country and buyer type. Signed-in users only; saved to their Privy record
 * and to a cookie the server components read.
 */
const Body = z.object({ country: z.string().regex(/^[A-Z]{2}$/), who: z.enum(["citizen", "foreigner"]) });

export async function POST(request: Request) {
  const userId = await userFrom(request);
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid profile." }, { status: 400 });
  const { country, who } = parsed.data;
  if (!(await api.countries()).some(c => c.code === country))
    return NextResponse.json({ error: `Vestail doesn't cover ${country} yet.` }, { status: 400 });

  await saveProfileFor(userId, { country, who });
  const res = NextResponse.json({ country, who });
  res.cookies.set(PROFILE_COOKIE, `${country}:${who}`, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 365 });
  return res;
}

/** Signing out clears the profile cookie too. */
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(PROFILE_COOKIE);
  return res;
}
