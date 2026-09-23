/**
 * When to warn a buyer that a route is pricing away from the market.
 *
 * The server refuses above 10%, where a purchase is plainly
 * value-destroying. Between here and there it routes — Vestail discloses
 * rather than forbids — but routing silently at 3% would be the same thing
 * the product exists to complain about: a cost that is knowable before the
 * trade and shown to nobody.
 */
const WARN_ABOVE_PCT = 1.5;

export interface ImpactWarning {
  /** Magnitude, rounded for display. */
  percent: string;
  /** Roughly what it costs, in base units of the token being paid. */
  costUnits: bigint;
}

/**
 * A warning for this quote, or null when the price is close enough to the
 * market not to be worth a line of type.
 *
 * The magnitude is what matters, not the sign. Jupiter returns this value
 * signed and has been seen both ways for the same pair minutes apart, so a
 * one-sided reading would warn on half the occasions it should.
 *
 * The cost comes back in base units of the token being paid, for the view to
 * format: "about $1.40 of your $50" is a decision, "2.8%" is a statistic.
 */
export function impactWarning(
  priceImpactPct: number | null,
  payAmount: bigint | null,
): ImpactWarning | null {
  if (priceImpactPct === null || payAmount === null || payAmount <= BigInt(0)) return null;

  const magnitude = Math.abs(priceImpactPct);
  if (magnitude < WARN_ABOVE_PCT) return null;

  // Base units are integers, so the cost is scaled in integers too: a
  // percentage of a bigint, to four decimal places of a percent.
  const scaled = BigInt(Math.round(magnitude * 100));
  const costUnits = (payAmount * scaled) / BigInt(10_000);

  return { percent: magnitude.toFixed(1), costUnits };
}
