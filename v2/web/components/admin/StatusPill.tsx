import type { AdminHealthCheck } from "@/lib/admin-types";

const styles = { healthy: "bg-[#e8f4e4] text-[#285b1e]", attention: "bg-cond-wash text-cond-ink", unavailable: "bg-[#f9e5e1] text-[#7a2c20]" };

export function StatusPill({ status }: { status: AdminHealthCheck["status"] }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold capitalize ${styles[status]}`}>{status}</span>;
}
