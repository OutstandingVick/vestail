"use client";

import { useEffect, useState, type RefObject } from "react";

/** Reveal each connector once its destination card enters the viewport. */
export function useTrustReveal(stageRef: RefObject<HTMLDivElement | null>, count: number) {
  const [revealed, setRevealed] = useState(() => Array<boolean>(count).fill(false));

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const animated = window.matchMedia("(min-width: 900px) and (prefers-reduced-motion: no-preference)");
    const targets = Array.from(stage.querySelectorAll<HTMLElement>("[data-trust-card]")).slice(1);
    let observer: IntersectionObserver | undefined;

    const configure = () => {
      observer?.disconnect();
      if (!animated.matches) {
        setRevealed(Array<boolean>(count).fill(true));
        return;
      }
      setRevealed(Array<boolean>(count).fill(false));
      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = targets.indexOf(entry.target as HTMLElement);
          if (index < 0) continue;
          setRevealed((previous) => previous.map((value, i) => value || i === index));
          observer?.unobserve(entry.target);
        }
      }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });
      targets.forEach((target) => observer?.observe(target));
    };

    configure();
    animated.addEventListener("change", configure);
    return () => {
      observer?.disconnect();
      animated.removeEventListener("change", configure);
    };
  }, [stageRef, count]);

  return revealed;
}
