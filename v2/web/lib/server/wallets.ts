import "server-only";

import { PrivyClient } from "@privy-io/node";

/**
 * The Solana wallets linked to a Privy user: their external wallet and/or the
 * embedded one an email sign-in got. Read from Privy on the server, never taken
 * from the browser, so a portfolio is always the signed-in user's own.
 */
let client: PrivyClient | null = null;

export async function solanaWalletsOf(userId: string): Promise<string[]> {
  client ??= new PrivyClient({ appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID!, appSecret: process.env.PRIVY_APP_SECRET! });
  const user = await client.users()._get(userId);
  const accounts = (user.linked_accounts ?? []) as Array<{ type?: string; chain_type?: string; address?: string }>;
  return [...new Set(accounts.filter(a => a.type === "wallet" && a.chain_type === "solana" && a.address).map(a => a.address!))];
}
