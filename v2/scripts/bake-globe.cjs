/*
 * Bakes the footer's dot globe into a static SVG path.
 *
 * Vestail v1 already carries a land mask: one bit per point of a 100,000-point
 * Fibonacci sphere, set where the point falls on land (Natural Earth 110m, public
 * domain). v1 renders it with three.js. The v2 page has no build step and no
 * dependencies, so this bakes the same data into a path once, offline.
 *
 * Each dot is a zero-length stroke ("M x y h0") with a round linecap, which is
 * about a third the size of the equivalent <circle> and draws identically.
 *
 * Usage, from v2/:  node scripts/bake-globe.cjs [dots] > /tmp/globe.txt
 * The mask is read from ../lib/globe/landMask.ts on the repo's main branch.
 */
const { execSync } = require("child_process");

const WANT = Number(process.argv[2]) || 1800;
const LON = 18;            // degrees east at the centre: Europe, Africa, the Middle East
const TILT = 16;           // degrees of northward tilt, so it reads as a globe not a disc
const R = 500;             // path units; the SVG scales it

const src = execSync("git show main:lib/globe/landMask.ts", { encoding: "utf8", maxBuffer: 1 << 26 });
const bits = src.match(/bits:\s*"([^"]+)"/)[1];
const points = Number(src.match(/points:\s*(\d+)/)[1]);
const bytes = Buffer.from(bits, "base64");

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
