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

/** A USD price: two decimals, or four below $1 so small prices stay legible. */
export function formatUsd(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: amount < 1 ? 4 : 2,
  });
}

/** Compact USD for liquidity: $2.1M, $925K, $50. */
export function formatCompactUsd(amount: number): string {
  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  });
}

/** Signed percentage with one decimal: +32.9%, −23.9%, 0.0%. */
export function formatSignedPct(pct: number): string {
  const rounded = Math.round(pct * 10) / 10;
  if (rounded === 0) return "0.0%";
  const sign = rounded > 0 ? "+" : "−";
  return `${sign}${Math.abs(rounded).toFixed(1)}%`;
}

/** "just now", "4 min ago", "3 h ago", "2 d ago" from unix seconds. */
export function formatAge(unixSeconds: number, now = Date.now()): string {
  const s = Math.max(0, Math.round(now / 1000 - unixSeconds));
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return `${Math.floor(s / 86400)} d ago`;
}
