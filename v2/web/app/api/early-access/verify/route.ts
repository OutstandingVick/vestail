import { NextRequest, NextResponse } from "next/server";

import {
  EARLY_ACCESS_COOKIE,
  createEarlyAccessAuthorization,
  validEarlyAccessCookie,
} from "@/lib/server/early-access-code";
import { reserveInvite } from "@/lib/server/invites";

export async function GET(request: NextRequest) {
  const verified = validEarlyAccessCookie(request.cookies.get(EARLY_ACCESS_COOKIE)?.value);
  return NextResponse.json({ verified });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { code?: unknown } | null;
  const code = typeof body?.code === "string" ? body.code : "";

  const inviteHash = await reserveInvite(code);
  if (!inviteHash) return NextResponse.json({ error: "That code is invalid, expired, already used, or currently reserved." }, { status: 401 });

  const response = NextResponse.json({ verified: true });
  const authorization = createEarlyAccessAuthorization(inviteHash);
  response.cookies.set(EARLY_ACCESS_COOKIE, authorization.value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: authorization.maxAge,
  });
  return response;
}
