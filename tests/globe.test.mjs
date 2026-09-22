import assert from "node:assert/strict";
import { describe, it } from "node:test";

// landPoints.ts is not imported here: its extensionless relative imports
// resolve under the bundler but not under Node's type stripping. The test
// decodes the bits itself, which also checks the format independently.
const { fibonacciLonLat } = await import(new URL("../lib/globe/fibonacci.ts", import.meta.url));
const { LAND_MASK } = await import(new URL("../lib/globe/landMask.ts", import.meta.url));

const bytes = Uint8Array.from(atob(LAND_MASK.bits), (c) => c.charCodeAt(0));
const land = (i) => (bytes[i >> 3] & (1 << (i & 7))) !== 0;

/** Index of the mask point nearest to [lon, lat]. */
function nearest(lon, lat) {
  const toRad = Math.PI / 180;
  let best = -1;
  let bestD = Infinity;
  for (let i = 0; i < LAND_MASK.points; i++) {
    const [plon, plat] = fibonacciLonLat(i, LAND_MASK.points);
    const d =
      Math.sin(((plat - lat) * toRad) / 2) ** 2 +
      Math.cos(plat * toRad) * Math.cos(lat * toRad) * Math.sin(((plon - lon) * toRad) / 2) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

describe("land mask", () => {
  it("has one bit per point and the stated land count", () => {
    assert.equal(bytes.length, Math.ceil(LAND_MASK.points / 8));
    let count = 0;
    for (let i = 0; i < LAND_MASK.points; i++) if (land(i)) count++;
    assert.equal(count, LAND_MASK.landPoints);
  });

  it("covers roughly Earth's real land fraction (~29%)", () => {
    const f = LAND_MASK.landPoints / LAND_MASK.points;
    assert.ok(f > 0.26 && f < 0.32, `land fraction ${f}`);
  });

  const places = [
    ["Sahara", 13, 23, true],
    ["central Australia", 134, -25, true],
    ["Brazil", -52, -10, true],
    ["Greenland", -40, 72, true],
    ["Antarctica", 0, -82, true],
    ["mid-Atlantic", -30, 0, false],
    ["mid-Pacific", -150, 0, false],
    ["Indian Ocean", 80, -20, false],
    // The mirror check: a flipped longitude sign would swap these two.
    ["Japan", 139, 36, true],
    ["Pacific at Japan's mirror longitude", -139, 36, false],
  ];
  for (const [name, lon, lat, expected] of places) {
    it(`${name} is ${expected ? "land" : "sea"}`, () => {
      assert.equal(land(nearest(lon, lat)), expected);
    });
  }
});
