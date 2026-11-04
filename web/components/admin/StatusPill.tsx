import { CheckCircle, WarningCircle, XCircle } from "@phosphor-icons/react/dist/ssr";

import type { AdminHealthCheck } from "@/lib/admin-types";

const styles = { healthy: "bg-[#e8f4e4] text-[#285b1e]", attention: "bg-cond-wash text-cond-ink", unavailable: "bg-[#f9e5e1] text-[#7a2c20]" };
const icons = { healthy: CheckCircle, attention: WarningCircle, unavailable: XCircle };

export function StatusPill({ status }: { status: AdminHealthCheck["status"] }) {
  const Icon = icons[status];
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold capitalize ${styles[status]}`}><Icon size={14} weight="fill" aria-hidden="true" />{status}</span>;
}
