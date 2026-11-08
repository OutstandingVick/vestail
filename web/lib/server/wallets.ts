import "server-only";

import { PrivyClient } from "@privy-io/node";

// Read linked wallets from Privy instead of accepting browser-supplied addresses.
let client: PrivyClient | null = null;

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
