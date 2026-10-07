"use client";

import {
  ArrowRight,
  ArrowSquareOut,
  ArrowsDownUp,
  CaretDown,
  CaretUpDown,
  Check,
  Hash,
  X,
  type Icon as PhosphorIcon,
  type IconProps,
} from "@phosphor-icons/react";

/** Keep the current component API stable while sourcing every UI glyph from Phosphor. */
const ICONS = {
  "chevron-down": CaretDown,
  "chevron-updown": CaretUpDown,
  check: Check,
  "arrow-right": ArrowRight,
  "swap-vertical": ArrowsDownUp,
  close: X,
  hash: Hash,
  "external-link": ArrowSquareOut,
} satisfies Record<string, PhosphorIcon>;

export type IconName = keyof typeof ICONS;

export function Icon({
  name,
  className = "size-[1em]",
  weight = "regular",
  ...props
}: { name: IconName } & IconProps) {
  const Phosphor = ICONS[name];

  return (
    <Phosphor
      size="1em"
      weight={weight}
      color="currentColor"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...props}
    />
  );
}
