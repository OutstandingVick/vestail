import type { VerdictStatus } from "@/lib/types";

/** The four states a version can be in on screen: three verdicts, or none. */
export type BadgeStatus = VerdictStatus | "not_assessed";

/**
 * One badge vocabulary for the whole site.
 *
 * The app and the docs have to agree on what "conditional" looks like: the
 * docs teach the reader a colour and a word, and the app is where they meet
 * it again. Shared, so the two cannot drift.
 */
export const VERDICT_BADGE: Record<BadgeStatus, { label: string; className: string }> = {
  eligible: { label: "Eligible", className: "text-eligible ring-eligible/60 bg-eligible/10" },
  conditional: {
    label: "Conditional",
    className: "text-conditional ring-conditional/60 bg-conditional/10",
  },
  restricted: {
    label: "Restricted",
    className: "text-restricted ring-restricted/60 bg-restricted/10",
  },
  not_assessed: { label: "Not assessed", className: "text-white/60 ring-white/20" },
};
