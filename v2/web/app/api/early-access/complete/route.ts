import { NextRequest, NextResponse } from "next/server";

import { EARLY_ACCESS_COOKIE, readEarlyAccessAuthorization } from "@/lib/server/early-access-code";
import { completeInvite } from "@/lib/server/invites";
import { userFrom } from "@/lib/server/privy";

export async function POST(request: NextRequest) {
  if (!(await userFrom(request))) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const inviteHash = readEarlyAccessAuthorization(request.cookies.get(EARLY_ACCESS_COOKIE)?.value);
  if (!inviteHash) return NextResponse.json({ error: "Invitation authorization expired." }, { status: 401 });
  if (!(await completeInvite(inviteHash))) return NextResponse.json({ error: "Invitation could not be redeemed." }, { status: 409 });
  const response = NextResponse.json({ redeemed: true });
  response.cookies.delete(EARLY_ACCESS_COOKIE);
  return response;
}
