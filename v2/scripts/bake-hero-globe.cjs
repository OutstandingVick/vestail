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
      rings.push(flat(ring));
    }
  }
}

const points = rings.reduce((n, r) => n + r.length / 2, 0);
process.stderr.write(`rings kept: ${rings.length} (${points} points), dropped below ${MIN_AREA} sq deg: ${dropped}\n`);
process.stdout.write(JSON.stringify({ rings }));
