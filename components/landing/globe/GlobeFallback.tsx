import type { GlobePlacement } from "./layout";

/**
 * First-paint stand-in for the 3D globe: a softly lit sphere with a violet
 * atmosphere, at exactly the place the canvas will draw. Pure CSS, so it is
 * in the server HTML, costs nothing, and means the hero never jumps when the
 * scene loads. Positioned in container units of the stage.
 */
export function GlobeFallback({ placement: p }: { placement: GlobePlacement }) {
  const size = p.radiusW * 2 * 100;
  return (
    <div
      aria-hidden
      className="absolute rounded-full"
      style={{
        left: `${(p.centreXW - p.radiusW) * 100}cqw`,
        top: `${p.topH * 100}cqh`,
        width: `${size}cqw`,
        height: `${size}cqw`,
        background:
          "radial-gradient(circle at 30% 26%, #3b2c8f 0%, #1c1a55 32%, #0e1336 62%, #0a122a 100%)",
        boxShadow:
          "0 0 6cqw 1.2cqw rgb(150 120 255 / 0.28), inset 0 0 3cqw rgb(170 150 255 / 0.25)",
      }}
    />
  );
}
