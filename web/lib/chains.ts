import { base, robinhood } from "viem/chains";

export const EVM_CHAINS = {
  base: { chain: base, id: 8453, name: "Base", explorer: "https://basescan.org", kyber: "base" },
  robinhood: { chain: robinhood, id: 4663, name: "Robinhood Chain", explorer: "https://robinhoodchain.blockscout.com", kyber: "robinhood" },
} as const;

export type EvmChainKey = keyof typeof EVM_CHAINS;
export const isEvmChain = (c: string): c is EvmChainKey => c in EVM_CHAINS;

export const NATIVE_ETH = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
