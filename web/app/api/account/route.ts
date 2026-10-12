import { NextResponse } from "next/server";
import { z } from "zod";

import { updateMetadata, userFrom } from "@/lib/server/privy";
import { AVATAR_COLORS } from "@/lib/account";

/**
 * POST /api/account { name?, avatar? } — the user's display name and avatar
 * colour, kept on their Privy record. Optional and cosmetic: Vestail never
 * asks for a legal name, and nothing here is identity verification.
 */
const Body = z.object({
  name: z.string().trim().max(40).optional(),
  avatar: z.enum(AVATAR_COLORS).optional(),
});

export async function POST(request: Request) {
  const userId = await userFrom(request);
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Names can be up to 40 characters." }, { status: 400 });
  const patch: Record<string, string> = {};
  if (parsed.data.name !== undefined) patch.name = parsed.data.name;
  if (parsed.data.avatar) patch.avatar = parsed.data.avatar;
  await updateMetadata(userId, patch);
  return NextResponse.json(patch);
}
