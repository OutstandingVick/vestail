import { earlyAccessSchema } from "@/lib/early-access-schema";
import { earlyAccessRateAllowed } from "@/lib/server/early-access-rate";
import { saveEarlyAccess } from "@/lib/server/early-access-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") return Response.json({ error: "Not found." }, { status: 404 });
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  if (!earlyAccessRateAllowed(ip)) return Response.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });

  const input = await request.json().catch(() => null);
  const parsed = earlyAccessSchema.safeParse(input);
  if (!parsed.success) return Response.json({ error: "Check the highlighted fields.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  if (parsed.data.website) return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });

  try {
    await saveEarlyAccess({ ...parsed.data, created_at: new Date().toISOString() });
    return Response.json({ ok: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "We couldn't save your place. Please try again." }, { status: 503 });
  }
}
