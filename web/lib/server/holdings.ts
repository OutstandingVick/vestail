import "server-only";

import { USDC_MINT } from "@/lib/constants";
import { jupiterHeaders } from "@/lib/server/jupiter";

const RPC = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
const TOKEN_PROGRAMS = ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"];
const SOL_MINT = "So11111111111111111111111111111111111111112";

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(RPC, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const body = await res.json();
  if (body.error) throw new Error(`RPC ${method}: ${body.error.message}`);
  return body.result as T;
}

type ParsedAccount = { account: { data: { parsed: { info: { mint: string; tokenAmount: { uiAmount: number | null } } } } } };

export async function balancesOf(wallets: string[]): Promise<{ sol: number; tokens: Map<string, number> }> {
  const tokens = new Map<string, number>();
  let lamports = 0;
  await Promise.all(wallets.flatMap(owner => [
    rpc<{ value: number }>("getBalance", [owner]).then(r => { lamports += r.value; }),
    ...TOKEN_PROGRAMS.map(programId =>
      rpc<{ value: ParsedAccount[] }>("getTokenAccountsByOwner", [owner, { programId }, { encoding: "jsonParsed" }]).then(r => {
        for (const a of r.value) {
          const { mint, tokenAmount } = a.account.data.parsed.info;
          if (tokenAmount.uiAmount) tokens.set(mint, (tokens.get(mint) ?? 0) + tokenAmount.uiAmount);
        }
      })),
  ]));
  return { sol: lamports / 1e9, tokens };
}

export async function pricesOf(mints: string[]): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  if (!mints.length) return prices;
  const res = await fetch(`https://api.jup.ag/tokens/v2/search?query=${mints.slice(0, 100).join(",")}`, {
    headers: jupiterHeaders(), next: { revalidate: 30 },
  });
  if (!res.ok) return prices;
  for (const t of (await res.json()) as Array<{ id: string; usdPrice?: number | null }>) if (t.usdPrice) prices.set(t.id, t.usdPrice);
  return prices;
}

export { SOL_MINT, USDC_MINT };

// Neither signer has signed yet, so simulation checks execution without signatures.
export async function simulateBase64(transaction: string): Promise<string | null> {
  try {
    const result = await rpc<{ value: { err: unknown; logs: string[] | null } }>("simulateTransaction", [
      transaction, { encoding: "base64", sigVerify: false, replaceRecentBlockhash: true, commitment: "processed" },
    ]);
    return result.value.err ? JSON.stringify(result.value.err) : null;
  } catch (e) {
    return e instanceof Error ? e.message : "simulation failed";
  }
}
