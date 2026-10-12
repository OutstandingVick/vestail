/*
 * Bakes the hero globe's geography into one compact JSON, offline.
 *
 * The landing page has no build step and no runtime dependencies, so the
 * country outlines can't be loaded from topojson in the browser. This reads
 * world-atlas (Natural Earth, public domain) from the v1 app's node_modules at
 * the repo root, converts it once, and writes plain arrays the page can draw
 * with a hand-rolled orthographic projection.
 *
 * Usage, from v2/:  node scripts/bake-hero-globe.cjs > app/assets/globe.json
 */
const { execSync } = require("child_process");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const topojson = require(path.join(ROOT, "node_modules/topojson-client"));
const world = require(path.join(ROOT, "node_modules/world-atlas/countries-110m.json"));

const fc = topojson.feature(world, world.objects.countries);
process.stderr.write(`countries in source: ${fc.features.length}\n`);

/*
 * Rings are flattened to [lon, lat, lon, lat, ...] and quantised to 0.1 degree
 * (about 11km), which is far finer than a globe this size can show and roughly
 * halves the bytes. Rings enclosing less than MIN_AREA square degrees are
 * dropped: at this scale they are single pixels, and there are hundreds of them.
 */
const QUANT = 1;            // decimal places
const MIN_AREA = 1.2;       // square degrees

const ringArea = r => {
  let a = 0;
  for (let i = 0, n = r.length; i < n; i++) {
    const [x1, y1] = r[i], [x2, y2] = r[(i + 1) % n];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a / 2);
};

/*
 * Douglas-Peucker, run per ring before quantising. At the sizes this globe is
 * drawn, a degree is roughly two or three pixels, so a tolerance well under one
 * degree is already sub-pixel and the coastline reads the same with a third of
 * the points.
 */
const TOLERANCE = 0.35;      // degrees

function dp(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    if (b - a < 2) continue;
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
    let far = -1, best = tol;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = pts[i];
      // Perpendicular distance to the chord, or to the point itself if the
      // chord has no length (which happens on a ring that returns to its start).
      const d = len
        ? Math.abs(dy * (px - ax) - dx * (py - ay)) / len
        : Math.hypot(px - ax, py - ay);
      if (d > best) { best = d; far = i; }
    }
    if (far > 0) { keep[far] = 1; stack.push([a, far], [far, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}

/*
 * A closed ring starts and ends on the same point, so running Douglas-Peucker
 * over it whole leaves a zero-length chord that every point sits on top of, and
 * the whole coastline collapses to two points. Cut the ring at the point
 * furthest from its start, simplify each half, then rejoin.
 */
function simplify(ring, tol) {
  if (ring.length < 5) return ring;
  const [ax, ay] = ring[0];
  let k = 0, best = -1;
  for (let i = 1; i < ring.length - 1; i++) {
    const d = Math.hypot(ring[i][0] - ax, ring[i][1] - ay);
    if (d > best) { best = d; k = i; }
  }
  const head = dp(ring.slice(0, k + 1), tol);
  const tail = dp(ring.slice(k), tol);
  return head.concat(tail.slice(1));
}

const flat = r => {
  const out = [];
  for (const [lon, lat] of r) out.push(+lon.toFixed(QUANT), +lat.toFixed(QUANT));
  return out;
};

const rings = [];
let dropped = 0;
for (const f of fc.features) {
  const g = f.geometry;
  if (!g) continue;
  const polys = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];
  for (const poly of polys) {
    for (const ring of poly) {
      if (ringArea(ring) < MIN_AREA) { dropped++; continue; }
      rings.push(flat(simplify(ring, TOLERANCE)));
    }
  }
}

const points = rings.reduce((n, r) => n + r.length / 2, 0);
process.stderr.write(`rings kept: ${rings.length} (${points} points at ${TOLERANCE} deg), dropped below ${MIN_AREA} sq deg: ${dropped}\n`);
process.stdout.write(JSON.stringify({ rings }));
