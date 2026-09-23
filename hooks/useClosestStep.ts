"use client";

import { useEffect, useRef, useState } from "react";

/** One measurement per animation frame, only while motion is permitted. */
export function useClosestStep() {
  const listRef = useRef<HTMLOListElement>(null);
  const [activeStep, setActiveStep] = useState<number | null>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const update = () => {
      frame = 0;
      if (motion.matches) return;
      const bounds = list.getBoundingClientRect();
      if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) {
        setActiveStep(null);
        return;
      }
      const middle = window.innerHeight / 2;
      let closest = 0;
      let distance = Infinity;
      Array.from(list.children).forEach((step, index) => {
        const badge = step.querySelector("[data-step-badge]");
        const rect = (badge ?? step).getBoundingClientRect();
        const delta = Math.abs(rect.top + rect.height / 2 - middle);
        if (delta < distance) {
          distance = delta;
          closest = index;
        }
      });
      setActiveStep(closest);
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    const resize = new ResizeObserver(schedule);

    const configure = () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      resize.disconnect();
      window.cancelAnimationFrame(frame);
      frame = 0;
      if (motion.matches) {
        setActiveStep(null);
        return;
      }
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule);
      resize.observe(list);
      schedule();
    };

    configure();
    motion.addEventListener("change", configure);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      motion.removeEventListener("change", configure);
      resize.disconnect();
    };
  }, []);

  return { listRef, activeStep };
}
