import { base, robinhood } from "viem/chains";

/**
 * The EVM chains Vestail buys on. One EVM wallet address works on all of
 * them; gas is ETH on both. Buys are paid in native ETH so no token approval
 * is ever needed: the swap is one transaction with a known value.
 */
export const EVM_CHAINS = {
  base: { chain: base, id: 8453, name: "Base", explorer: "https://basescan.org", kyber: "base" },
  robinhood: { chain: robinhood, id: 4663, name: "Robinhood Chain", explorer: "https://robinhoodchain.blockscout.com", kyber: "robinhood" },
} as const;

export type EvmChainKey = keyof typeof EVM_CHAINS;
export const isEvmChain = (c: string): c is EvmChainKey => c in EVM_CHAINS;

/** Native ETH as an aggregator input token. */
export const NATIVE_ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
