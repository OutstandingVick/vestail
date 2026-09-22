import { fibonacciPoint } from "./fibonacci";
import { LAND_MASK } from "./landMask";

/**
 * Unit-sphere positions of every land dot, rebuilt from the baked bitmask.
 * Returns x, y, z triples ready for a three.js BufferAttribute.
 */
export function landPositions(mask = LAND_MASK): Float32Array {
  const bytes = decodeBase64(mask.bits);
  const out = new Float32Array(mask.landPoints * 3);
  let k = 0;
  for (let i = 0; i < mask.points; i++) {
    if (bytes[i >> 3] & (1 << (i & 7))) {
      fibonacciPoint(i, mask.points, out, k);
      k += 3;
    }
  }
  return out;
}

/** Whether point `i` of the mask is land. */
export function isLand(i: number, mask = LAND_MASK): boolean {
  return (decodeBase64(mask.bits)[i >> 3] & (1 << (i & 7))) !== 0;
}

function decodeBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
