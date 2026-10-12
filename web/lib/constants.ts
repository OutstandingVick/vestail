/**
 * Onchain constants for buying tokenised versions, carried over from v1.
 * Only USDC is offered as the pay token in v2 for now.
 */

/** Circle's USDC on Solana mainnet: the input mint of every order. */
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
/** USDC is a 6-decimal mint, so 1 USDC is 1_000_000 base units. */
export const USDC_DECIMALS = 6;
/** Wrapped SOL; only needed to size the SOL a swap may take from the buyer. */
export const WSOL_MINT = "So11111111111111111111111111111111111111112";

/**
 * Jupiter Swap API V2: GET /order -> sign -> POST /execute. Not Ultra, not the
 * legacy /swap/v1 pair. The key is a server-side secret (JUPITER_API_KEY).
 */
export const JUPITER_API_BASE = process.env.JUPITER_API_URL || "https://api.jup.ag/swap/v2";
export const JUPITER_ORDER_ENDPOINT = `${JUPITER_API_BASE}/order`;
export const JUPITER_EXECUTE_ENDPOINT = `${JUPITER_API_BASE}/execute`;
