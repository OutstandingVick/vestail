import type { Status } from "@/lib/types";

// Conditional is a distinct verdict, not a boolean form of allowed.
export const VERDICT: Record<Status, { label: string; short: string }> = {
  can_own: { label: "Can own", short: "Can own" },
  conditional: { label: "Conditional", short: "Conditional" },
  cannot_own: { label: "Cannot own", short: "Cannot own" },
};

export const STATUS_ORDER: Record<Status, number> = { can_own: 0, conditional: 1, cannot_own: 2 };

export const routable = (s: Status | null): s is "can_own" | "conditional" => s === "can_own" || s === "conditional";
