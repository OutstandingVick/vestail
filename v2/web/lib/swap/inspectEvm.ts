/**
 * What an EVM buy transaction from KyberSwap is allowed to be.
 *
 * The aggregator's response is untrusted input from a third party. Buys are
 * paid in native ETH, so a legitimate one is a single call to KyberSwap's
 * router carrying exactly the amount the buyer chose, with the buyer's own
 * address as the recipient. Anything else is refused before it is offered for
 * signature. Pure and synchronous, so it runs on the server and in tests.
 */

/** KyberSwap's MetaAggregationRouterV2, the same address on Base and Robinhood Chain. */
export const KYBER_ROUTER = "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5";

/** The router's swap entrypoints, by selector. */
const ALLOWED_SELECTORS = new Set(["0xe21fd0e9" /* swap(SwapExecutionParams) */, "0x8af033fb" /* swapSimpleMode */]);

export interface EvmTx { to: string; data: string; value: string }

export function inspectEvmBuy(tx: EvmTx, expect: { taker: string; amountWei: string }): { ok: true } | { ok: false; reason: string } {
  const lower = (s: string) => s.toLowerCase();
  if (lower(tx.to) !== lower(KYBER_ROUTER)) return { ok: false, reason: "The swap isn't addressed to KyberSwap's router." };
  if (!/^0x[0-9a-fA-F]+$/.test(tx.data) || tx.data.length < 10) return { ok: false, reason: "The swap's calldata is malformed." };
  if (!ALLOWED_SELECTORS.has(lower(tx.data.slice(0, 10)))) return { ok: false, reason: "The swap calls something other than a router swap." };
  if (BigInt(tx.value) !== BigInt(expect.amountWei)) return { ok: false, reason: "The swap would send a different amount of ETH than you chose." };
  // The output must come back to the buyer: their address has to be in the call.
  if (!lower(tx.data).includes(lower(expect.taker).slice(2))) return { ok: false, reason: "The swap doesn't send the tokens to your wallet." };
  return { ok: true };
}
