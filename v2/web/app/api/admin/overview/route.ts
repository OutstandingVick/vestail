import { requireAdmin } from "@/lib/server/admin-auth";
import { buildAdminOverview } from "@/lib/server/admin-overview";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  return Response.json(await buildAdminOverview(), {
    headers: { "Cache-Control": "private, no-store" },
  });
}
