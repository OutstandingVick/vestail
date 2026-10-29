import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";

/*
 * Every endpoint the service exposes needs a page a person can read.
 *
 * The error list drifted from four documented codes to seventeen raised ones
 * before anyone noticed, and the same thing happens to endpoints: a route is
 * added, the spec is updated because a test enforces it, and the prose is
 * forgotten because nothing does. This is that nothing.
 *
 * It checks paths, not wording. A page can be thin and still pass; what it
 * cannot be is absent.
 */
const API = new URL("../docs/api/", import.meta.url);
const SPEC = new URL("./openapi.yaml", API);
const REFERENCE = new URL("./reference/", API);
const PUBLIC_ROUTES = new URL("../services/api/src/public/routes.js", import.meta.url);
const APP = new URL("../services/api/src/app.js", import.meta.url);

/*
 * Only headings count.
 *
 * An earlier version searched the whole text of every page, which meant a
 * cross-link was enough to mark an endpoint documented — deleting venues.md
 * entirely still passed, because other pages linked to it. A guard that
 * cannot fail is worse than no guard: it reports a property nobody has.
 *
 * So coverage means an endpoint is the subject of a heading somewhere, which
 * is what "has a page" was always supposed to mean.
 */
const headings = () =>
  readdirSync(REFERENCE)
    .filter(f => f.endsWith(".md"))
    .flatMap(f => [...readFileSync(new URL(f, REFERENCE), "utf8").matchAll(/^#{1,3} (.+)$/gm)].map(m => m[1]))
    .join("\n");

/** Top-level paths declared in the hand-written internal spec. */
export function specPaths(yaml) {
  const body = yaml.slice(yaml.indexOf("\npaths:"));
  return [...body.matchAll(/^ {2}(\/[^\s:]*):/gm)].map(m => m[1]);
}

/** Routes registered on the partner API, e.g. api.post("/check", …). */
export function partnerPaths(source) {
  return [...source.matchAll(/api\.(?:get|post)\(\s*"([^"]+)"/g)].map(m => m[1]);
}

/*
 * Routes registered directly on the internal router, e.g. v1.get("/health", …).
 *
 * Reading only the spec missed these: /v1/health and /v1/openapi.json exist in
 * app.js and appear nowhere in openapi.yaml, so a guard that trusted the spec
 * reported full coverage while two endpoints were documented nowhere at all.
 * The router is the thing that is true; the spec is a description of it.
 */
export function routerPaths(source) {
  return [...source.matchAll(/v1\.(?:get|post)\(\s*"([^"]+)"/g)].map(m => m[1]);
}

/**
 * A path is covered when some reference page mentions it. Parameter names
 * differ between a spec ({country}) and prose ({country} or :id), so both the
 * braced and the bare form count.
 */
const covered = (path, text) => {
  const bare = path.replace(/\{[^}]+\}|:[A-Za-z]+/g, "").replace(/\/+$/, "");
  return text.includes(path) || (bare.length > 1 && text.includes(bare));
};

test("every internal endpoint in the spec has a reference page", () => {
  const text = headings();
  const missing = specPaths(readFileSync(SPEC, "utf8")).filter(p => !covered(p, text));
  assert.deepEqual(missing, [], `no reference page mentions: ${missing.join(", ")}`);
});

test("every partner endpoint has a reference page", () => {
  const text = headings();
  const missing = partnerPaths(readFileSync(PUBLIC_ROUTES, "utf8")).filter(p => !covered(p, text));
  assert.deepEqual(missing, [], `no reference page mentions: ${missing.join(", ")}`);
});

test("every route registered on the internal router has a reference page", () => {
  const text = headings();
  const missing = routerPaths(readFileSync(APP, "utf8")).filter(p => !covered(p, text));
  assert.deepEqual(missing, [], `no reference page mentions: ${missing.join(", ")}`);
});

test("the matchers find something, so neither check can pass vacuously", () => {
  assert.ok(specPaths(readFileSync(SPEC, "utf8")).length >= 10);
  assert.ok(partnerPaths(readFileSync(PUBLIC_ROUTES, "utf8")).length >= 4);
  assert.ok(routerPaths(readFileSync(APP, "utf8")).length >= 2);
});
