/*
 * Bakes the hero globe's geography into one compact JSON, offline.
 *
 * The landing page has no build step and no runtime dependencies, so the
 * country outlines can't be loaded from topojson in the browser. This reads
 * world-atlas (Natural Earth, public domain) from the v1 app's node_modules at
 * the repo root, converts it once, and writes plain arrays the page can draw
 * with a hand-rolled orthographic projection.
 *
 * The page has to keep working opened straight from disk, where fetch() of a
 * sibling file is blocked, so the output is pasted into app/index.html as the
 * contents of <script id="globe-geo" type="application/json">. Re-run this and
 * replace that one line when the geography or the pin list changes.
 *
 * Usage, from v2/:  node scripts/bake-hero-globe.cjs
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

/*
 * Labels. Each country gets one anchor point and a name. The anchor is the
 * area-weighted centroid of its rings, which lands inside the country for every
 * shape here (it would not for a crescent, and the United States is the one to
 * watch: Alaska and Hawaii pull it west, so the lower 48 ring is used alone).
 *
 * `own` marks the twelve countries Vestail has rules for. The rest are context:
 * drawn quieter, so the globe reads as a map rather than a dozen floating names.
 */
const OWN = new Set([
  "Nigeria", "United Kingdom", "United States of America", "United Arab Emirates",
  "China", "India", "Brazil", "Saudi Arabia", "Germany", "Japan",
  "South Africa", "South Korea",
]);

// Natural Earth's long forms are too wide to set on a globe.
const SHORT = {
  "United States of America": "United States",
  "United Arab Emirates": "UAE",
  "Dem. Rep. Congo": "DR Congo",
  "Central African Rep.": "Central African Rep.",
  "Bosnia and Herz.": "Bosnia",
  "Dominican Rep.": "Dominican Rep.",
  "Papua New Guinea": "Papua New Guinea",
  "Czechia": "Czechia",
  "Solomon Is.": "Solomon Is.",
  "Eq. Guinea": "Eq. Guinea",
  "S. Sudan": "South Sudan",
  "W. Sahara": "W. Sahara",
  "N. Cyprus": "N. Cyprus",
  "Falkland Is.": "Falkland Is.",
  "Fr. S. Antarctic Lands": null,
  "Antarctica": null,
  "Greenland": "Greenland",
};

/*
 * Below this the country is too small for its name to sit on it. Vestail's own
 * twelve are kept whatever their size — the UAE and South Korea are both well
 * under the limit and both have to be on the globe — and their labels are
 * nudged clear of the outline instead.
 */
const LABEL_MIN_AREA = 18;   // square degrees

const centroid = ring => {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0, n = ring.length; i < n; i++) {
    const [x1, y1] = ring[i], [x2, y2] = ring[(i + 1) % n];
    const f = x1 * y2 - x2 * y1;
    a += f; cx += (x1 + x2) * f; cy += (y1 + y2) * f;
  }
  if (!a) return null;
  return { lon: cx / (3 * a), lat: cy / (3 * a), area: Math.abs(a / 2) };
};

const labels = [];
let unnamed = 0;
for (const f of fc.features) {
  const raw = f.properties && f.properties.name;
  if (!raw) { unnamed++; continue; }
  const name = raw in SHORT ? SHORT[raw] : raw;
  if (!name) continue;

  const g = f.geometry;
  if (!g) continue;
  const polys = g.type === "Polygon" ? [g.coordinates] : g.type === "MultiPolygon" ? g.coordinates : [];

  // The outer ring of the largest part, not the mean of every part: an island
  // chain's average sits in open water.
  let best = null;
  for (const poly of polys) {
    const c = centroid(poly[0]);
    if (c && (!best || c.area > best.area)) best = c;
  }
  const own = OWN.has(raw);
  if (!best || (best.area < LABEL_MIN_AREA && !own)) continue;

  labels.push({
    n: name,
    lon: +best.lon.toFixed(1),
    lat: +best.lat.toFixed(1),
    own: own ? 1 : 0,
  });
}

labels.sort((a, b) => b.own - a.own || a.n.localeCompare(b.n));
const ownFound = labels.filter(l => l.own).length;
process.stderr.write(`labels: ${labels.length} (${ownFound}/12 of Vestail's countries), ${unnamed} unnamed features\n`);

/*
 * Pins. One per market Vestail has rules for, placed on that country's main
 * financial centre. These are fixed city coordinates, not activity: the globe
 * must not imply live orders or real-time location, so nothing here moves and
 * nothing here is a number.
 */
const PINS = [
  { c: "NG", city: "Lagos",        lon:   3.4, lat:   6.5 },
  { c: "GB", city: "London",       lon:  -0.1, lat:  51.5 },
  { c: "US", city: "New York",     lon: -74.0, lat:  40.7 },
  { c: "AE", city: "Dubai",        lon:  55.3, lat:  25.2 },
  { c: "CN", city: "Shanghai",     lon: 121.5, lat:  31.2 },
  { c: "IN", city: "Mumbai",       lon:  72.9, lat:  19.1 },
  { c: "BR", city: "São Paulo",    lon: -46.6, lat: -23.5 },
  { c: "SA", city: "Riyadh",       lon:  46.7, lat:  24.7 },
  { c: "DE", city: "Frankfurt",    lon:   8.7, lat:  50.1 },
  { c: "JP", city: "Tokyo",        lon: 139.7, lat:  35.7 },
  { c: "ZA", city: "Johannesburg", lon:  28.0, lat: -26.2 },
  { c: "KR", city: "Seoul",        lon: 127.0, lat:  37.6 },
];

const countries = require(path.join(__dirname, "../data/countries.json"));
const known = new Set((countries.countries || countries).map(c => c.code));
const missing = PINS.filter(p => !known.has(p.c)).map(p => p.c);
const uncovered = [...known].filter(c => !PINS.some(p => p.c === c));
if (missing.length) throw new Error(`pins for countries with no rules: ${missing.join(", ")}`);
if (uncovered.length) throw new Error(`countries with rules but no pin: ${uncovered.join(", ")}`);
process.stderr.write(`pins: ${PINS.length}, one per country in data/countries.json\n`);

const points = rings.reduce((n, r) => n + r.length / 2, 0);
process.stderr.write(`rings kept: ${rings.length} (${points} points at ${TOLERANCE} deg), dropped below ${MIN_AREA} sq deg: ${dropped}\n`);
process.stdout.write(JSON.stringify({ rings, labels, pins: PINS }));
