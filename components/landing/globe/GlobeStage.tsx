"use client";

import { useEffect, useRef, useState } from "react";

import { GlobeFallback } from "./GlobeFallback";
import { GLOBE_PLACEMENT, type GlobeVariant } from "./layout";

/** Which stage CSS is showing; must match the Hero's md breakpoint. */
const DESKTOP_QUERY = "(min-width: 768px)";

/**
 * The copy over the desktop globe, measured from the page: every element
 * marked data-globe-avoid, in the stage's own coordinates. Used only to
 * arrange the reduced-motion still frame so no coin rests on the text.
 */
function copyRects(stage: HTMLElement) {
  const origin = stage.getBoundingClientRect();
  return [...document.querySelectorAll<HTMLElement>("[data-globe-avoid]")].map((el) => {
    const b = el.getBoundingClientRect();
    return {
      left: b.left - origin.left,
      top: b.top - origin.top,
      right: b.right - origin.left,
      bottom: b.bottom - origin.top,
    };
  });
}

/**
 * The box the globe lives in: the CSS stand-in always, and the three.js
 * canvas on top once it has loaded and drawn its first frame.
 *
 * Both variants are in the HTML (CSS shows one), but only the visible one
 * ever loads the scene, so the page never holds two WebGL contexts. The
 * scene is imported when the browser is idle after first paint, which keeps
 * three.js out of the critical path.
 */
export function GlobeStage({ variant }: { variant: GlobeVariant }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(false);
  const [drawn, setDrawn] = useState(false);

  // Track whether this variant is the one on screen.
  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY);
    const update = () => setActive(query.matches === (variant === "desktop"));
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [variant]);

  useEffect(() => {
    if (!active) return;
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;

    let disposed = false;
    let handle: { dispose(): void } | undefined;

    const start = () => {
      import("./scene")
        .then(({ mountGlobe }) => {
          if (disposed) return;
          handle = mountGlobe(stage, canvas, {
            placement: GLOBE_PLACEMENT[variant],
            avoidRects: variant === "desktop" ? () => copyRects(stage) : undefined,
            onFirstFrame: () => setDrawn(true),
          });
        })
        .catch(() => {
          // No WebGL, or the chunk failed: the CSS stand-in stays, which is
          // a complete (if still) globe. Nothing to surface to the visitor.
        });
    };

    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(start, { timeout: 1500 })
      : window.setTimeout(start, 200);

    return () => {
      disposed = true;
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      handle?.dispose();
      setDrawn(false);
    };
  }, [active, variant]);

  return (
    <div
      ref={stageRef}
      className="absolute inset-0 overflow-hidden @container-size"
    >
      <GlobeFallback placement={GLOBE_PLACEMENT[variant]} />
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full transition-opacity duration-700 ${
          drawn ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
