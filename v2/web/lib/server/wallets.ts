import "server-only";

import { PrivyClient } from "@privy-io/node";

/**
 * The wallets linked to a Privy user (Solana and EVM): their external wallets
 * and/or the embedded ones Privy made. Read from Privy on the server, never taken
 * from the browser, so a portfolio is always the signed-in user's own.
 */
let client: PrivyClient | null = null;

/** Every wallet linked to the user, by chain family. */
export async function walletsOf(userId: string): Promise<{ solana: string[]; evm: string[] }> {
  client ??= new PrivyClient({ appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!, appSecret: process.env.PRIVY_APP_SECRET! });
  const user = await client.users()._get(userId);
  const accounts = (user.linked_accounts ?? []) as Array<{ type?: string; chain_type?: string; address?: string }>;
  const of = (t: string) => [...new Set(accounts.filter(a => a.type === "wallet" && a.chain_type === t && a.address).map(a => a.address!))];
  return { solana: of("solana"), evm: of("ethereum") };
}

export async function solanaWalletsOf(userId: string): Promise<string[]> {
  return (await walletsOf(userId)).solana;
}
