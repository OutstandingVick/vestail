/**
 * The heaped coins along the bottom of the footer.
 *
 * Generated rather than drawn: a seeded pseudo-random pile, so the same
 * arrangement comes out of the server render and the browser's hydration.
 * An unseeded Math.random here would produce two different piles and a
 * hydration mismatch, and would also make the layout impossible to test.
 */

/** The tickers on the pile's faces. Text only — never a company logo. */
export const PILE_TICKERS = [
  "NVDA",
  "TSLA",
  "AAPL",
  "SPY",
  "QQQ",
  "MSFT",
  "GOOGL",
  "AMZN",
  "META",
  "AMD",
  "COIN",
  "HOOD",
] as const;

export interface PileCoin {
  /** Centre, in the band's own coordinates. */
  x: number;
  y: number;
  /** Radius, in the same coordinates. */
  r: number;
  /** Degrees. */
  rotation: number;
  ticker: string;
  /** 0 at the back of the pile, 1 at the front. */
  depth: number;
}

export interface PileOptions {
  count: number;
  width: number;
  height: number;
  seed: number;
}

/**
 * mulberry32: a small, fast, well-distributed 32-bit generator.
 *
 * Any seeded generator would do; this one is four lines and has no state
 * beyond a single integer, which keeps the pile reproducible from nothing
 * but its seed.
 */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The height of the pile's top edge at `x`: three sine waves of different
 * periods, summed.
 *
 * One wave reads as a machine-made ripple; three that do not divide into
 * each other never repeat across the width, which is what makes the heap
 * look poured rather than arranged.
 */
function crest(x: number, width: number, height: number): number {
  const t = x / width;
  const wave =
    Math.sin(t * Math.PI * 2 * 1.7 + 0.6) * 0.5 +
    Math.sin(t * Math.PI * 2 * 3.3 + 2.1) * 0.3 +
    Math.sin(t * Math.PI * 2 * 6.1 + 4.4) * 0.2;
  // 0 is the top of the band; the crest sits in its upper third.
  return height * 0.3 + wave * height * 0.16;
}

/**
 * A pile of coins: dense, overlapping, jumbled, heaped against the bottom
 * of the band with an uneven top edge.
 *
 * Coins are returned back to front, so drawing them in order layers the
 * near ones over the far ones. Depth drives radius as well as the colour
 * and blur the component applies, so the pile reads as deep rather than as
 * a flat scatter.
 */
export function coinPile({ count, width, height, seed }: PileOptions): PileCoin[] {
  const random = seededRandom(seed);
  const coins: PileCoin[] = [];

  for (let i = 0; i < count; i++) {
    const depth = random();
    // Near coins are twice the size of far ones, and big enough that the
    // heap overlaps into a solid mass rather than a scatter of discs.
    const r = height * (0.09 + depth * 0.09);
    // Spread past both edges, so the band bleeds off the viewport rather
    // than stopping in a tidy line.
    const x = -r + random() * (width + r * 2);
    const top = crest(x, width, height);
    // Heaped: more coins low in the band than high in it, so the pile has
    // a dense floor and a ragged crest. A square root skews the sample
    // towards the bottom; squaring it would pack them under the crest and
    // leave the floor thin, which is a pile upside down.
    const fall = Math.sqrt(random());
    const y = top + fall * (height - top + r);

    coins.push({
      x,
      y,
      r,
      rotation: random() * 90 - 45,
      ticker: PILE_TICKERS[Math.floor(random() * PILE_TICKERS.length)],
      depth,
    });
  }

  return coins.sort((a, b) => a.depth - b.depth);
}
