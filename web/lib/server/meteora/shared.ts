import "server-only";

import { Connection, Keypair, PublicKey, Transaction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";

export const connection = () => new Connection(process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com", "confirmed");

export async function toV0(conn: Connection, tx: Transaction, payer: PublicKey, coSigners: Keypair[] = []): Promise<string> {
  const { blockhash } = await conn.getLatestBlockhash("confirmed");
  const message = new TransactionMessage({ payerKey: payer, recentBlockhash: blockhash, instructions: tx.instructions }).compileToV0Message();
  const v0 = new VersionedTransaction(message);
  if (coSigners.length) v0.sign(coSigners);
  return Buffer.from(v0.serialize()).toString("base64");
}

export function toUnits(amount: string, decimals: number): bigint {
  if (!/^\d+(\.\d+)?$/.test(amount)) throw new Error("Enter amounts as plain numbers.");
  const [w, f = ""] = amount.split(".");
  return BigInt(w) * BigInt(10) ** BigInt(decimals) + BigInt((f + "0".repeat(decimals)).slice(0, decimals));
}
