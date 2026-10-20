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

  const application = {
    xHandle: parsed.data.xHandle,
    email: parsed.data.email,
    country: parsed.data.country,
    relationship: parsed.data.relationship,
    wallet: parsed.data.wallet,
    experience: parsed.data.experience,
    reason: parsed.data.reason,
    telegram: parsed.data.telegram,
  };
  try {
    const result = await saveTesterApplication({ ...application, status: "pending", created_at: new Date().toISOString() });
    if (result === "duplicate_email") return Response.json({ error: "An application with this email already exists.", fields: { email: ["This email has already been used."] } }, { status: 409, headers: { "Cache-Control": "no-store" } });
    if (result === "duplicate_wallet") return Response.json({ error: "An application with this wallet already exists.", fields: { wallet: ["This wallet has already been used."] } }, { status: 409, headers: { "Cache-Control": "no-store" } });
    return Response.json({ ok: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "We couldn't save your application. Please try again." }, { status: 503 });
  }
}
