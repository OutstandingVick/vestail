import "server-only";

import { isAdminUser } from "@/lib/admin-access";
import { userFrom } from "@/lib/server/privy";

export async function adminFrom(request: Request): Promise<string | null> {
  const userId = await userFrom(request);
  return isAdminUser(userId) ? userId : null;
}

export async function requireAdmin(request: Request): Promise<Response | null> {
  return (await adminFrom(request)) ? null : Response.json({ error: "Owner access required." }, { status: 403 });
}
