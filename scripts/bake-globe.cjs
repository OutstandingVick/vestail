/*
 * Bakes the footer's dot globe into a static SVG path.
 *
 * The mask is one bit per point of a 100,000-point Fibonacci sphere, set where
 * the point falls on land (Natural Earth 110m, public domain). It was generated
 * by v1 and now lives in v2 as data/globe/land-mask.json. The v2 page has no
 * build step, so this bakes it into a path once, offline.
 *
 * Each dot is a zero-length stroke ("M x y h0") with a round linecap, which is
 * about a third the size of the equivalent <circle> and draws identically.
 *
 * Usage, from v2/:  node scripts/bake-globe.cjs [dots] > /tmp/globe.txt
 */

const WANT = Number(process.argv[2]) || 1800;
const LON = 18;            // degrees east at the centre: Europe, Africa, the Middle East
const TILT = 16;           // degrees of northward tilt, so it reads as a globe not a disc
const R = 500;             // path units; the SVG scales it

const mask = require("../data/globe/land-mask.json");
const { points } = mask;
const bytes = Buffer.from(mask.bits, "base64");

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const isLand = i => bytes[i >> 3] & (1 << (i & 7));

// Spin east by LON, then tilt the north pole towards the viewer.
const a = (-LON * Math.PI) / 180, t = (TILT * Math.PI) / 180;
const dots = [];
for (let i = 0; i < points; i++) {
  if (!isLand(i)) continue;
  const y0 = 1 - (2 * i + 1) / points;
  const r = Math.sqrt(1 - y0 * y0);
  const phi = i * GOLDEN_ANGLE;
  let x = Math.cos(phi) * r, z = Math.sin(phi) * r, y = y0;
  [x, z] = [x * Math.cos(a) - z * Math.sin(a), x * Math.sin(a) + z * Math.cos(a)];
  [y, z] = [y * Math.cos(t) - z * Math.sin(t), y * Math.sin(t) + z * Math.cos(t)];
  if (z <= 0) continue;    // near hemisphere only
  dots.push([x, y]);
}

// Thin evenly rather than by index, so the sampling stays uniform across the face.
const step = Math.max(1, Math.round(dots.length / WANT));
const kept = dots.filter((_, i) => i % step === 0);
const d = kept.map(([x, y]) =>
  `M${(x * R).toFixed(0)} ${(-y * R).toFixed(0)}h0`).join("");

process.stderr.write(`land points: ${dots.length} on the near face, kept ${kept.length}, ${d.length} bytes\n`);
process.stdout.write(d);
