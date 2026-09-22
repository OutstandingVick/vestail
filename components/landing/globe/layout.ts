/**
 * Where the globe sits, as fractions of its stage. The single source for
 * both the CSS placeholder (container units) and the three.js scene
 * (pixels), which is what keeps the placeholder and the canvas aligned
 * exactly when the scene fades in.
 *
 *   radius  = radiusW * stage width
 *   centreX = centreXW * stage width
 *   top     = topH * stage height        (the globe's topmost point)
 */
export interface GlobePlacement {
  radiusW: number;
  centreXW: number;
  topH: number;
  /** How many coins orbit in this variant. */
  coins: number;
}

export const GLOBE_PLACEMENT = {
  /** Behind the copy: 1.3x the viewport wide, bottom-right, cropped. */
  desktop: { radiusW: 0.65, centreXW: 0.74, topH: 0.4, coins: 8 },
  /** Below the copy: smaller, still wider than the screen. */
  mobile: { radiusW: 0.56, centreXW: 0.58, topH: 0.16, coins: 5 },
} satisfies Record<string, GlobePlacement>;

export type GlobeVariant = keyof typeof GLOBE_PLACEMENT;

/** Pixel geometry for a stage of the given size. */
export function globeGeometry(p: GlobePlacement, width: number, height: number) {
  const r = p.radiusW * width;
  return { r, cx: p.centreXW * width, cy: p.topH * height + r };
}
