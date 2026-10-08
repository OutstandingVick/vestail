import { test } from "node:test";
import assert from "node:assert/strict";
import { createApp } from "../src/app.js";

const KEY = "test-key";
const app = createApp({ apiKeys: [KEY], useSample: false });
const click = async (body, key = KEY) => {
  const res = await app.request("/v1/orders/click", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(key && { Authorization: `Bearer ${key}` }) },
    body: JSON.stringify(body),
  });
  return { res, body: await res.json() };
};
// Crypto is conditional for a Nigerian citizen in the sample rules, so this click carries the acknowledgement.
const luno = { country: "NG", asset: "cryptocurrency", who: "citizen", venue: "Luno", session: "s1", query: "bitcoin", acknowledged: true };

test("a valid click is recorded and returns the tagged redirect", async () => {
  const { res, body } = await click(luno);
  assert.equal(res.status, 201);
  assert.match(body.id, /^clk_/);
  assert.equal(body.redirect, "https://www.luno.com?ref=vestail");
  const feed = await (await app.request("/v1/activity")).json();
  assert.equal(feed.recent[0].venue, "Luno");
});

test("a missing or wrong key is 401 unauthorized", async () => {
  for (const key of [null, "nope"]) {
    const { res, body } = await click(luno, key);
    assert.equal(res.status, 401);
    assert.equal(body.error.code, "unauthorized");
  }
});

test("auth is checked before the body", async () => {
  const { res } = await click({}, null);
  assert.equal(res.status, 401);
});

test("no keys configured means nothing is accepted", async () => {
  const res = await createApp({ apiKeys: [] }).request("/v1/orders/click", {
    method: "POST", headers: { Authorization: "Bearer anything" }, body: JSON.stringify(luno),
  });
  assert.equal(res.status, 401);
});

test("a cannot_own cell cannot be routed", async () => {
  const rules = await (await app.request("/v1/rules/NG?who=foreigner")).json();
  const blocked = Object.keys(rules.rules).find(id => rules.rules[id] === "cannot_own");
  const { res, body } = await click({ ...luno, who: "foreigner", asset: blocked });
  assert.equal(res.status, 400);
  assert.equal(body.error.code, "validation");
});

test("a conditional rule needs the acknowledgement", async () => {
  const rule = await (await app.request("/v1/rules/NG/cryptocurrency")).json();
  assert.equal(rule.status, "conditional", "fixture: NG crypto is conditional for citizens");
  for (const acknowledged of [undefined, false]) {
    const { res, body } = await click({ ...luno, acknowledged });
    assert.equal(res.status, 400);
    assert.equal(body.error.code, "acknowledgement_required");
  }
  assert.equal((await click({ ...luno, acknowledged: "yes" })).body.error.code, "validation", "must be a boolean");
});

test("a can_own rule needs no acknowledgement", async () => {
  const rule = await (await app.request("/v1/rules/US/domestic_equities")).json();
  assert.equal(rule.status, "can_own", "fixture: US domestic equities are open to citizens");
  const { res } = await click({ country: "US", asset: "domestic_equities", who: "citizen", venue: "Robinhood" });
  assert.equal(res.status, 201);
});

test("a venue not listed for the rule is refused", async () => {
  const { res } = await click({ ...luno, venue: "Evil Exchange" });
  assert.equal(res.status, 400);
});

test("body is validated against the spec", async () => {
  assert.equal((await click({ ...luno, venue: undefined })).body.error.code, "validation");
  assert.equal((await click({ ...luno, who: "tourist" })).body.error.code, "bad_buyer_type");
  assert.equal((await click({ ...luno, country: "XX" })).body.error.code, "unknown_country");
  assert.equal((await click({ ...luno, asset: "moon_rocks" })).body.error.code, "unknown_asset");
});

const nvdaNG = async () => (await (await app.request("/v1/tokens/NVDA?country=NG")).json()).tokens[0].mint;
const swap = mint => ({ country: "NG", asset: "foreign_equities", who: "citizen", venue: "Jupiter", mint });

test("a token swap click is judged by the token verdict", async () => {
  const mint = await nvdaNG();
  const refused = await click(swap(mint));
  assert.equal(refused.body.error.code, "acknowledgement_required");
  const ok = await click({ ...swap(mint), acknowledged: true });
  assert.equal(ok.res.status, 201);
  assert.equal(ok.body.redirect, `https://jup.ag/swap/USDC-${mint}?ref=vestail`);
});

test("a not-assessed token is never routed, even acknowledged", async () => {
  const mint = await nvdaNG();
  const { body } = await click({ ...swap(mint), country: "GB", acknowledged: true });
  assert.equal(body.error.code, "not_assessed");
});

test("a cannot_own token is refused", async () => {
  const mint = await nvdaNG();
  const { body } = await click({ ...swap(mint), country: "US", asset: "domestic_equities", acknowledged: true });
  assert.equal(body.error.code, "validation");
});

test("a swap click must name the governing class, Jupiter, and a known mint", async () => {
  const mint = await nvdaNG();
  assert.equal((await click({ ...swap(mint), asset: "gold_bullion", acknowledged: true })).body.error.code, "validation");
  assert.equal((await click({ ...swap(mint), venue: "Bamboo", acknowledged: true })).body.error.code, "validation");
  assert.equal((await click({ ...swap("NotAMint111"), acknowledged: true })).body.error.code, "unknown_mint");
});

test("GET /orders returns one buyer's presses, newest first, for the same key only", async () => {
  await click({ ...luno, session: "hist" });
  await click({ ...swap(await nvdaNG()), session: "hist", acknowledged: true });
  const res = await app.request("/v1/orders?session=hist", { headers: { Authorization: `Bearer ${KEY}` } });
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.equal(body.length, 2);
  assert.equal(body[0].venue, "Jupiter");
  assert.ok(body[0].mint && body[0].acknowledged);
  assert.equal((await app.request("/v1/orders?session=hist")).status, 401);
});
