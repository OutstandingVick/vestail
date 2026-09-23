import { SYMBOL_ALLOWLIST, type AllowedSymbol } from "@/lib/constants";

/**
 * The symbols on the hero's coins, in the order they are handed out.
 *
 * Typed as the app's own allowlist, so the hero can only ever show a stock
 * Vestail actually resolves: adding a coin for something unsupported is a
 * type error, and dropping a symbol from the app breaks the build here
 * rather than leaving a coin advertising a stock the app cannot find.
 *
 * The order is for the hero, not the app. Eight coins show on a desktop and
 * five on a phone, so the most recognisable names come first, with SpaceX
 * early because a private company on a coin says what Vestail is for better
 * than another megacap does.
 */
export const COIN_SYMBOLS: readonly AllowedSymbol[] = [
  "NVDA",
  "TSLA",
  "SPCX",
  "AAPL",
  "SPY",
  "MSFT",
  "GOOGL",
  "AMZN",
  "QQQ",
  "OPENAI",
  "KALSHI",
];

if (process.env.NODE_ENV !== "production") {
  const missing = SYMBOL_ALLOWLIST.filter((s) => !COIN_SYMBOLS.includes(s));
  if (missing.length > 0) {
    console.warn(`coin order is missing ${missing.join(", ")}`);
  }
}

export interface CoinColours {
  /** The face, lit. */
  face: string;
  /** The milled edge: the same colour a step darker. */
  edge: string;
  /** The stamped symbol. */
  ink: string;
}

/**
 * One palette per symbol, taken from that company's own brand colour and
 * lifted to a tint that holds up at coin size on a dark page: a saturated
 * face with dark ink, the way a minted token reads.
 *
 * Hues are spread across the first eight — the ones a desktop shows — so no
 * two coins on screen at once are the same colour.
 */
export const COIN_COLOURS: Record<AllowedSymbol, CoinColours> = {
  NVDA: { face: "#93d244", edge: "#6fa32c", ink: "#12300f" },
  TSLA: { face: "#ef6d73", edge: "#c44a51", ink: "#3c1013" },
  SPCX: { face: "#dfe3ee", edge: "#b3b9c9", ink: "#1b2333" },
  AAPL: { face: "#b8bfcc", edge: "#8f97a6", ink: "#1b1f26" },
  SPY: { face: "#6fa3f5", edge: "#4a79c9", ink: "#0b2449" },
  MSFT: { face: "#ffc94d", edge: "#d29f2c", ink: "#3b2a06" },
  GOOGL: { face: "#7fd19b", edge: "#57a573", ink: "#0b2e1c" },
  AMZN: { face: "#ffab5e", edge: "#d1823c", ink: "#3a1f04" },
  QQQ: { face: "#4fd1c5", edge: "#2fa69c", ink: "#063230" },
  OPENAI: { face: "#c9c2f5", edge: "#9a92cc", ink: "#1d1840" },
  KALSHI: { face: "#f28fc2", edge: "#c66a99", ink: "#3d0c28" },
};
