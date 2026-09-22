/**
 * Presentation helpers. No domain logic here.
 */

/**
 * Formats a USDC amount for display.
 *
 * Always two decimals, grouped — this is money, and a balance that renders as
 * "1000" in one place and "1,000.00" in another reads as two different
 * numbers. Rounding is display-only; order sizing works from base units.
 */
export function formatUsdc(amount: number): string {
  return amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
