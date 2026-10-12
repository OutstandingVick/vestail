import type { Status } from "@/lib/types";

/**
 * Three verdicts, never two. There is deliberately no "allowed" boolean in
 * this app: conditional is its own state with its own gate, and folding it
 * into either neighbour is the mistake this product exists to avoid.
 */
export const VERDICT: Record<Status, { label: string; short: string }> = {
  can_own: { label: "Can own", short: "Can own" },
  conditional: { label: "Conditional", short: "Conditional" },
  cannot_own: { label: "Cannot own", short: "Cannot own" },
};

/** Most open first, as the API's status sort does. */
export const STATUS_ORDER: Record<Status, number> = { can_own: 0, conditional: 1, cannot_own: 2 };

/** Whether something with this status may be routed to a venue at all. */
export const routable = (s: Status | null): s is "can_own" | "conditional" => s === "can_own" || s === "conditional";
