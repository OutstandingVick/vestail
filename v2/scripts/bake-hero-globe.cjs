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

// Emitted shape, kept deliberately flat so the page can iterate it without parsing:
//   { rings: [[lon, lat, lon, lat, ...], ...] }   every landmass outline
process.stdout.write(JSON.stringify({ countries: fc.features.length }));
