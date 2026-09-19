/**
 * Presentation helpers. No domain logic here.
 */

/**
 * Shortens a base58 address for display: 7vfC…8Kj2.
 *
 * Keeps four characters at each end. Truncation is display-only — the full
 * address is always what gets copied or signed. Addresses shorter than the
 * kept window are returned unchanged rather than padded into something that
 * looks abbreviated but is not.
 */
export function truncateAddress(address: string, chars = 4): string {
  if (address.length <= chars * 2 + 1) return address;
  return `${address.slice(0, chars)}…${address.slice(-chars)}`;
}

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
