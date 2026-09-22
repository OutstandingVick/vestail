/**
 * Exact conversion between decimal strings and token base units.
 *
 * Money never goes through a float here: 0.1 + 0.2 is not 0.3, and a swap
 * amount that is off by one base unit is a different order. Everything is
 * string and bigint arithmetic.
 */

/**
 * "12.5" with 6 decimals -> 12500000n. Returns null for anything that is not
 * a plain non-negative decimal, or that has more fractional digits than the
 * token supports (rather than silently rounding the user's input).
 */
export function toBaseUnits(input: string, decimals: number): bigint | null {
  const trimmed = input.trim();
  const match = /^(\d*)(?:\.(\d*))?$/.exec(trimmed);
  if (!match || trimmed === "" || trimmed === ".") return null;

  const [, whole = "", frac = ""] = match;
  if (frac.length > decimals) return null;

  return BigInt((whole || "0") + frac.padEnd(decimals, "0"));
}

/** 12500000n with 6 decimals -> "12.5". Trailing zeros are dropped. */
export function fromBaseUnits(amount: bigint | string, decimals: number): string {
  const value = BigInt(amount);
  const negative = value < BigInt(0);
  const digits = (negative ? -value : value).toString().padStart(decimals + 1, "0");
  const whole = digits.slice(0, digits.length - decimals);
  const frac = digits.slice(digits.length - decimals).replace(/0+$/, "");
  return `${negative ? "-" : ""}${whole}${frac ? `.${frac}` : ""}`;
}

/**
 * Clean what the user typed into an amount field as they type: digits and
 * one decimal point (a comma counts as one), at most `decimals` fractional
 * digits. Returns a string, not a number, so "0.10" and "5." survive while
 * the user is still typing.
 */
export function sanitizeAmount(raw: string, decimals: number): string {
  const cleaned = raw.replace(/,/g, ".").replace(/[^\d.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  if (rest.length === 0) return whole;
  return `${whole}.${rest.join("").slice(0, decimals)}`;
}
