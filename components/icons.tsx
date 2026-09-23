import type { SVGProps } from "react";

/**
 * Vestail's icons.
 *
 * One set, one grid, one weight. Before this the interface drew a chevron
 * here, an arrow there and a "+" somewhere else, each on its own viewBox at
 * its own stroke width, so no two of them looked like they came from the
 * same hand.
 *
 * The convention is the one the landing page already used: a 32-unit grid,
 * 1.75 stroke, round caps and joins, `currentColor` throughout, and no fill.
 * Icons are drawn here rather than installed: they are a few hundred bytes
 * of geometry, and a dependency that renders into the page where people sign
 * transactions is a dependency worth not having.
 *
 * Sized in `em` so an icon matches the text beside it by default; pass a
 * size class to override.
 */

const PATHS = {
  /** Opens a picker. */
  "chevron-down": "M9 13 16 20 23 13",
  /** Cycles between two values, as on the pay-token button. */
  "chevron-updown": "M10 14 16 8 22 14M10 18 16 24 22 18",
  /** A chosen option. */
  check: "M7 16.5 13 22.5 25 9.5",
  /** Leads the eye to the consequence, in a list of them. */
  "arrow-right": "M5 16H26M18.5 8.5 26 16l-7.5 7.5",
  /** The direction of a swap. Decorative on a buy-only app. */
  "swap-vertical": "M11 26V6M6 11l5-5 5 5M21 6v20M16 21l5 5 5-5",
  /** Dismisses a toast. */
  close: "M8 8 24 24M24 8 8 24",
  /** An anchor to a section of the docs. */
  hash: "M12.5 4 10 28M22 4 19.5 28M5 11.5H27M4 20.5H26",
  /** Leaves the page. */
  "external-link": "M18 6h8v8M26 6 16 16M24 18v6a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h6",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  className = "size-[1em]",
  ...props
}: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
