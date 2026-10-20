import { testerApplicationSchema } from "@/lib/tester-application-schema";
import { testerApplicationRateAllowed } from "@/lib/server/tester-application-rate";
import { saveTesterApplication } from "@/lib/server/tester-application-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || request.headers.get("x-real-ip") || "unknown";
  if (!testerApplicationRateAllowed(ip)) return Response.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });

  const input = await request.json().catch(() => null);
  const parsed = testerApplicationSchema.safeParse(input);
  if (!parsed.success) return Response.json({ error: "Check the highlighted fields.", fields: parsed.error.flatten().fieldErrors }, { status: 400 });
  if (parsed.data.website) return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });

  const { website: _website, ...application } = parsed.data;
  try {
    const result = await saveTesterApplication({ ...application, status: "pending", created_at: new Date().toISOString() });
    return Response.json({ ok: result === "created", duplicate: result === "created" ? undefined : result }, { status: result === "created" ? 201 : 409, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "We couldn't save your application. Please try again." }, { status: 503 });
  }
}
