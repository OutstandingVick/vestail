import assert from "node:assert/strict";
import { describe, it } from "node:test";

const { coinPile, seededRandom, PILE_TICKERS } = await import(
  new URL("../lib/landing/coinPile.ts", import.meta.url)
);

const opts = { count: 80, width: 1600, height: 260, seed: 7 };

describe("footer coin pile", () => {
  it("is the same pile every time, so the server and the browser agree", () => {
    assert.deepEqual(coinPile(opts), coinPile(opts));
  });

  it("is a different pile for a different seed", () => {
    assert.notDeepEqual(coinPile(opts), coinPile({ ...opts, seed: 8 }));
  });

  it("returns the requested number of coins", () => {
    assert.equal(coinPile(opts).length, 80);
    assert.equal(coinPile({ ...opts, count: 30 }).length, 30);
  });

  it("orders them back to front, so near coins draw over far ones", () => {
    const depths = coinPile(opts).map((c) => c.depth);
    assert.deepEqual(depths, [...depths].sort((a, b) => a - b));
  });

  it("heaps them against the bottom, none above the band", () => {
    for (const coin of coinPile(opts)) {
      assert.ok(coin.y + coin.r > 0, "a coin sits entirely above the band");
      assert.ok(coin.y - coin.r < opts.height, "a coin sits entirely below the band");
      // The crest lives in the upper third; nothing should float over it.
      assert.ok(coin.y > opts.height * 0.1, `a coin floats at y=${coin.y}`);
    }
  });

  it("bleeds off both edges rather than stopping short", () => {
    const coins = coinPile(opts);
    assert.ok(Math.min(...coins.map((c) => c.x - c.r)) < 0);
    assert.ok(Math.max(...coins.map((c) => c.x + c.r)) > opts.width);
  });

  it("draws near coins larger than far ones", () => {
    const coins = coinPile(opts);
    const near = coins[coins.length - 1];
    const far = coins[0];
    assert.ok(near.r > far.r, "the nearest coin is not the largest");
  });

  it("only ever writes a ticker from the list", () => {
    for (const coin of coinPile(opts)) {
      assert.ok(PILE_TICKERS.includes(coin.ticker), coin.ticker);
    }
  });

  it("gives the same sequence for the same seed", () => {
    const a = seededRandom(42);
    const b = seededRandom(42);
    for (let i = 0; i < 5; i++) assert.equal(a(), b());
  });
});
