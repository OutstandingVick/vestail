import { test } from "node:test";
import assert from "node:assert/strict";
import { json } from "./helpers.js";

test("GET /venues/{asset} tags every url with the default ref", async () => {
  const { res, body } = await json("/venues/cryptocurrency?country=NG");
  assert.equal(res.status, 200);
  assert.ok(body.some(x => x.name === "Luno"));
  assert.ok(body.filter(x => x.url).every(x => x.url.endsWith("ref=vestail")));
  assert.equal(res.headers.get("cache-control"), "public, max-age=86400");
});

test("ref overrides the tag, with or without the ref= prefix", async () => {
  for (const ref of ["partner_xyz", "ref=partner_xyz"]) {
    const { body } = await json(`/venues/cryptocurrency?country=IN&ref=${encodeURIComponent(ref)}`);
    const urls = body.filter(x => x.url).map(x => x.url);
    assert.ok(urls.length > 0);
    assert.ok(urls.every(u => u.endsWith("ref=partner_xyz") && !u.includes("ref=vestail")), ref);
  }
});

test("null urls stay null", async () => {
  const { body } = await json("/venues/residential_property");
  assert.ok(body.some(x => x.url === null));
});

test("unknown asset and country are rejected", async () => {
  assert.equal((await json("/venues/moon_rocks")).body.error.code, "unknown_asset");
  assert.equal((await json("/venues/cryptocurrency?country=XX")).body.error.code, "unknown_country");
});
