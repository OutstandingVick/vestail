import "server-only";

import type { AdminHealthCheck, AdminOverview } from "@/lib/admin-types";
import { summarizeAdminUsers } from "@/lib/admin-metrics";
import { api } from "@/lib/server/api";
import { productCoverage } from "@/lib/server/admin-product";
import { adminUsers } from "@/lib/server/admin-users";

export async function buildAdminOverview(): Promise<AdminOverview> {
  const started = Date.now();
  const [usersResult, catalogResult, coverageResult, activityResult] = await Promise.allSettled([
    adminUsers(),
    Promise.all([api.countries(), api.assets(), api.tokenSymbols(), api.derivatives()]),
    productCoverage(),
    api.activity(),
  ]);
  const health: AdminHealthCheck[] = [
    check("Customer accounts", usersResult),
    check("Product catalog", catalogResult),
    check("Rule coverage", coverageResult),
    check("Routing activity", activityResult),
    { name: "Admin response", status: "healthy", detail: `${Date.now() - started} ms to assemble` },
  ];
  const users = usersResult.status === "fulfilled" ? usersResult.value : [];
  const catalog = catalogResult.status === "fulfilled" ? catalogResult.value : [[], [], [], []] as const;
  const activity = activityResult.status === "fulfilled" ? activityResult.value : {
    stats: { volume_30d_usd: 0, volume_30d_delta_pct: 0, orders_routed: 0, orders_delta_pct: 0, active_buyers_7d: 0 }, recent: [],
  };
  return {
    generatedAt: new Date().toISOString(),
    users: summarizeAdminUsers(users),
    catalog: { countries: catalog[0].length, assets: catalog[1].length, tokenSymbols: catalog[2].length, markets: catalog[3].length },
    coverage: coverageResult.status === "fulfilled" ? coverageResult.value : [],
    activity,
    health,
    recentUsers: users.slice(0, 12),
  };
}

function check(name: string, result: PromiseSettledResult<unknown>): AdminHealthCheck {
  return result.status === "fulfilled"
    ? { name, status: "healthy", detail: "Live data loaded" }
    : { name, status: "unavailable", detail: result.reason instanceof Error ? result.reason.message : "Data could not be loaded" };
}
