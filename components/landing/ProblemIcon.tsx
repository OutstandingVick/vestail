import type { ReactNode } from "react";

/** Decorative: the adjacent heading supplies the meaning. */
export function ProblemIcon({ children }: { children: ReactNode }) {
  return (
    <svg width="48" height="48" viewBox="0 0 32 32" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}
