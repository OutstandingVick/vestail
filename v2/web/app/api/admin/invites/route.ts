import { generateInvites, listInvites, revokeInvite } from "@/lib/server/invites";
import { requireAdmin } from "@/lib/server/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  return Response.json({ invites: await listInvites() }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const body = await request.json().catch(() => null) as { count?: unknown } | null;
  const count = Number(body?.count);
  if (!Number.isInteger(count) || count < 1 || count > 100) return Response.json({ error: "Choose between 1 and 100 codes." }, { status: 400 });
  return Response.json({ invites: await generateInvites(count) }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
}

export async function DELETE(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  const body = await request.json().catch(() => null) as { id?: unknown } | null;
  if (typeof body?.id !== "string") return Response.json({ error: "Invitation id required." }, { status: 400 });
  return (await revokeInvite(body.id)) ? Response.json({ revoked: true }) : Response.json({ error: "Active invitation not found." }, { status: 404 });
}
