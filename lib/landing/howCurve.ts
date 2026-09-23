/** Percent coordinates; y is linear along this quadratic Bezier. */
export const HOW_CURVE_PATH = "M 38 0 Q 74 50 38 100";

/** The centre of each equally sized step row lies exactly on the path. */
export function howStepAnchor(index: number, count: number) {
  const t = (index + 0.5) / count;
  return { x: 38 + 72 * t * (1 - t), y: 100 * t };
}
