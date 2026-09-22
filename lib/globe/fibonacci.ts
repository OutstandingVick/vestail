/**
 * Evenly spaced points on a unit sphere (a Fibonacci spiral), shared by the
 * offline land-mask generator and the browser. Both must produce the same
 * point for the same index, so this file has no imports and no randomness.
 *
 * Axes match three.js: +y is north, the camera looks down -z.
 * Longitude 0 lies on +x; longitude increases towards -z.
 */

export const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

/** Point `i` of `n`, written into `out` at `offset` as x, y, z. */
export function fibonacciPoint(
  i: number,
  n: number,
  out: Float32Array | number[],
  offset = 0,
): void {
  const y = 1 - (2 * i + 1) / n;
  const r = Math.sqrt(1 - y * y);
  const phi = i * GOLDEN_ANGLE;
  out[offset] = Math.cos(phi) * r;
  out[offset + 1] = y;
  out[offset + 2] = Math.sin(phi) * r;
}

/** [longitude, latitude] in degrees for point `i` of `n`. */
export function fibonacciLonLat(i: number, n: number): [number, number] {
  const p = [0, 0, 0];
  fibonacciPoint(i, n, p);
  const lat = (Math.asin(p[1]) * 180) / Math.PI;
  const lon = (Math.atan2(-p[2], p[0]) * 180) / Math.PI;
  return [lon, lat];
}
