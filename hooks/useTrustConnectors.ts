"use client";

import { useEffect, useRef, useState } from "react";
import { trustConnectors } from "@/lib/landing/trustConnectors";

const EMPTY = { width: 0, height: 0, paths: [] as string[] };

export function useTrustConnectors() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [geometry, setGeometry] = useState(EMPTY);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const desktop = window.matchMedia("(min-width: 900px)");
    const cards = Array.from(stage.querySelectorAll<HTMLElement>("[data-trust-card]"));
    let frame = 0;

    const measure = () => {
      frame = 0;
      const bounds = stage.getBoundingClientRect();
      const paths = trustConnectors(cards.map((card) => {
        // Measure the unrotated wrapper: hover must not move the path.
        const rect = card.getBoundingClientRect();
        return { x: rect.left - bounds.left, y: rect.top - bounds.top, width: rect.width, height: rect.height };
      }));
      setGeometry((previous) =>
        previous.width === bounds.width && previous.height === bounds.height &&
        previous.paths.length === paths.length && previous.paths.every((path, i) => path === paths[i])
          ? previous : { width: bounds.width, height: bounds.height, paths });
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };
    const observer = new ResizeObserver(schedule);
    const configure = () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      frame = 0;
      if (!desktop.matches) {
        setGeometry(EMPTY);
        return;
      }
      observer.observe(stage);
      cards.forEach((card) => observer.observe(card));
      measure();
    };
    configure();
    desktop.addEventListener("change", configure);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(frame);
      desktop.removeEventListener("change", configure);
    };
  }, []);

  return { stageRef, geometry };
}
