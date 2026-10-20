import { requireAdmin } from "@/lib/server/admin-auth";
import { listTesterApplications } from "@/lib/server/tester-application-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  try {
    return Response.json(
      { applications: await listTesterApplications() },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return Response.json({ error: "Tester applications could not be loaded." }, { status: 503 });
  }
}
