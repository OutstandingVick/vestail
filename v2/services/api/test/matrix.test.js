import { test } from "node:test";
import assert from "node:assert/strict";
import { json } from "./helpers.js";

const STATUSES = ["can_own", "conditional", "cannot_own"];

test("empty query returns all 20 assets for every country", async () => {
  const { res, body } = await json("/matrix");
  assert.equal(res.status, 200);
  assert.equal(body.who, "citizen");
  assert.equal(body.resolution.stage, "all");
  assert.ok(body.rows.length >= 10);
  for (const r of body.rows) {
    assert.equal(r.cells.length, 20);
    assert.ok(r.cells.every(x => STATUSES.includes(x.status) && /^[a-z_]+$/.test(x.asset)));
    assert.equal(r.cta, null);
  }
});

test("Google is domestic in the US row and foreign elsewhere, with a cta", async () => {
  const { body } = await json("/matrix?q=Google");
  assert.equal(body.resolution.stage, "entity");
  const us = body.rows.find(r => r.code === "US"), ng = body.rows.find(r => r.code === "NG");
  assert.equal(us.cells[0].asset, "domestic_equities");
  assert.equal(ng.cells[0].asset, "foreign_equities");
  assert.equal(ng.cta.asset, "foreign_equities");
  assert.match(ng.cta.venues[0].url, /ref=vestail/);
});

test("sort=status ranks most-open first; sort=asset keeps index order", async () => {
  const { body: s } = await json("/matrix?q=farmland&who=foreigner&sort=status");
  const rank = { can_own: 2, conditional: 1, cannot_own: 0 };
  const scores = s.rows.map(r => rank[r.cells[0].status]);
  assert.deepEqual(scores, [...scores].sort((a, b) => b - a));
  const { body: a } = await json("/matrix?sort=asset");
  assert.deepEqual(a.rows[0].cells.map(x => x.index), [...Array(20).keys()]);
});

test("cannot_own rows get a cta with no venues", async () => {
  const { body } = await json("/matrix?q=farmland&who=foreigner");
  const blocked = body.rows.filter(r => r.cta.status === "cannot_own");
  assert.ok(blocked.length > 0);
  assert.ok(blocked.every(r => r.cta.venues.length === 0));
});

test("countries restricts rows; unknown codes are rejected", async () => {
  const { body } = await json("/matrix?countries=NG,gb");
  assert.deepEqual(body.rows.map(r => r.code).sort(), ["GB", "NG"]);
  const { res, body: err } = await json("/matrix?countries=NG,XX");
  assert.equal(res.status, 400);
  assert.equal(err.error.code, "unknown_country");
});

test("bad buyer type is rejected", async () => {
  const { res, body } = await json("/matrix?who=tourist");
  assert.equal(res.status, 400);
  assert.equal(body.error.code, "bad_buyer_type");
});
