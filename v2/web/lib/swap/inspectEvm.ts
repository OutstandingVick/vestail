/**
 * What an EVM buy transaction from KyberSwap is allowed to be.
 *
 * The aggregator's response is untrusted input from a third party. Buys are
 * paid in native ETH, so a legitimate one is a single call to KyberSwap's
 * router, spending exactly the ETH the buyer chose, swapping native ETH for
 * exactly the token they picked, with the output sent to the buyer. The
 * calldata is decoded with the router's own ABI and each of those fields is
 * checked; anything else is refused before it is offered for signature.
 * Pure and synchronous, so it runs on the server and in tests.
 */
import { decodeFunctionData, parseAbi } from "viem";

/** KyberSwap's MetaAggregationRouterV2, the same address on Base and Robinhood Chain. */
export const KYBER_ROUTER = "0x6131B5fae19EA4f9D964eAc0408E4408b66337b5";
const NATIVE = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee";

const ROUTER_ABI = parseAbi([
  "struct SwapDescriptionV2 { address srcToken; address dstToken; address[] srcReceivers; uint256[] srcAmounts; address[] feeReceivers; uint256[] feeAmounts; address dstReceiver; uint256 amount; uint256 minReturnAmount; uint256 flags; bytes permit; }",
  "struct SwapExecutionParams { address callTarget; address approveTarget; bytes targetData; SwapDescriptionV2 desc; bytes clientData; }",
  "function swap(SwapExecutionParams execution) payable returns (uint256, uint256)",
  "function swapSimpleMode(address caller, SwapDescriptionV2 desc, bytes executorData, bytes clientData) returns (uint256, uint256)",
]);

export interface EvmTx { to: string; data: string; value: string }

/** The most the onchain minimum may sit below the quote: Vestail's slippage ceiling, as on Solana. */
export const MAX_SLIPPAGE_BPS = BigInt(300);
type Result = { ok: true } | { ok: false; reason: string };

export function inspectEvmBuy(tx: EvmTx, expect: { taker: string; amountWei: string; tokenOut: string; quotedOut: string }): Result {
  const lower = (s: string) => s.toLowerCase();
  if (lower(tx.to) !== lower(KYBER_ROUTER)) return { ok: false, reason: "The swap isn't addressed to KyberSwap's router." };
  if (BigInt(tx.value) !== BigInt(expect.amountWei)) return { ok: false, reason: "The swap would send a different amount of ETH than you chose." };

  let decoded;
  try {
    decoded = decodeFunctionData({ abi: ROUTER_ABI, data: tx.data as `0x${string}` });
  } catch {
    return { ok: false, reason: "The swap calls something other than a router swap." };
  }
  const desc = decoded.functionName === "swap" ? decoded.args[0].desc : decoded.args[1];

  if (lower(desc.srcToken) !== NATIVE) return { ok: false, reason: "The swap would spend a token instead of the ETH you chose." };
  if (desc.amount !== BigInt(expect.amountWei)) return { ok: false, reason: "The swap's amount doesn't match what you chose." };
  if (lower(desc.dstToken) !== lower(expect.tokenOut)) return { ok: false, reason: "The swap would buy a different token than the one you picked." };
  if (lower(desc.dstReceiver) !== lower(expect.taker)) return { ok: false, reason: "The swap doesn't send the tokens to your wallet." };
  // The router reverts if the swap returns less than minReturnAmount. A tiny
  // minimum would let a sandwich take almost the whole buy, so it must sit
  // within the slippage ceiling of the quote the buyer was shown.
  const floor = (BigInt(expect.quotedOut) * (BigInt(10000) - MAX_SLIPPAGE_BPS)) / BigInt(10000);
  if (desc.minReturnAmount === BigInt(0) || desc.minReturnAmount < floor)
    return { ok: false, reason: "The swap's guaranteed minimum is too far below the quote." };
  if (desc.feeReceivers.length) return { ok: false, reason: "The swap would pay a fee to an address Vestail doesn't know." };
  return { ok: true };
}
