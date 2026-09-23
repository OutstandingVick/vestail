"use client";

import { useEffect, useState } from "react";

/**
 * Which section the reader is currently in, for the sidebar's highlight.
 *
 * An IntersectionObserver rather than a scroll listener: the browser does
 * the work off the main thread, so a long page still scrolls at frame rate.
 * The top margin matches the sticky header's height and the bottom one cuts
 * the viewport off low, so the "current" section is the one under the
 * reader's eye rather than whichever heading happens to be on screen.
 *
 * The last heading to cross the line wins; with nothing crossing (a short
 * final section, or a tall one scrolled past its heading) the previous
 * answer stands, which is why this keeps state rather than deriving it.
 */
export function useActiveSection(ids: readonly string[]): string | null {
  const [active, setActive] = useState<string | null>(ids[0] ?? null);

  useEffect(() => {
    const seen = new Map<string, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) seen.set(entry.target.id, entry.isIntersecting);
        const current = ids.filter((id) => seen.get(id));
        if (current.length > 0) setActive(current[0]);
      },
      { rootMargin: "-72px 0px -70% 0px" },
    );

    const elements = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [ids]);

  return active;
}
