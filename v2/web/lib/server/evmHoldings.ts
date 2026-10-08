import "server-only";

import { EVM_CHAINS, NATIVE_ETH, type EvmChainKey } from "@/lib/chains";

/**
 * What EVM wallets hold on Base and Robinhood Chain: ETH and the tracked stock
 * tokens, read with plain JSON-RPC (balanceOf). Priced by asking KyberSwap
 * what one unit is worth; a token with no route stays unpriced, never guessed.
 */
const RPC: Record<EvmChainKey, string> = {
  base: process.env.BASE_RPC_URL || "https://mainnet.base.org",
  robinhood: process.env.ROBINHOOD_RPC_URL || "https://rpc.mainnet.chain.robinhood.com",
};

async function rpc(chain: EvmChainKey, method: string, params: unknown[]): Promise<string> {
  const res = await fetch(RPC[chain], {
    method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const body = await res.json();
  if (body.error) throw new Error(`${chain} ${method}: ${body.error.message}`);
  return body.result as string;
}

const balanceOfData = (owner: string) => "0x70a08231" + owner.slice(2).toLowerCase().padStart(64, "0");

export async function ethBalance(chain: EvmChainKey, owner: string): Promise<number> {
  return Number(BigInt(await rpc(chain, "eth_getBalance", [owner, "latest"]))) / 1e18;
}

export async function tokenBalance(chain: EvmChainKey, token: string, owner: string, decimals: number): Promise<number> {
  const raw = await rpc(chain, "eth_call", [{ to: token, data: balanceOfData(owner) }, "latest"]);
  return Number(BigInt(raw === "0x" ? "0x0" : raw)) / 10 ** decimals;
}

/** USD value of one whole unit of `token` on `chain`, from KyberSwap's route valuation. */
export async function usdPrice(chain: EvmChainKey, token: string, decimals: number): Promise<number | null> {
  const one = (BigInt(10) ** BigInt(decimals)).toString();
  const tokenOut = token === NATIVE_ETH ? "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" : NATIVE_ETH;
  const url = `https://aggregator-api.kyberswap.com/${EVM_CHAINS[chain].kyber}/api/v1/routes?tokenIn=${token}&tokenOut=${tokenOut}&amountIn=${one}`;
  try {
    const res = await fetch(url, { headers: { "x-client-id": "vestail" }, next: { revalidate: 30 } });
    const body = await res.json();
    const v = Number(body?.data?.routeSummary?.amountInUsd);
    return body?.code === 0 && v > 0 ? v : null;
  } catch {
    return null;
  }
}
