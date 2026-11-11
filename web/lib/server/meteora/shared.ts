import "server-only";

import { Connection, Keypair, PublicKey, Transaction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";

/**
 * Shared plumbing for building Meteora liquidity transactions on the server.
 * The server only assembles instructions with the user's wallet as owner
 * and fee payer; it never signs for the user and holds no funds. Where a new
 * position account needs its own keypair, that throwaway keypair co-signs
 * the account's creation and is discarded: it controls nothing afterwards.
 */
export const connection = () => new Connection(process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com", "confirmed");

/** A legacy Transaction from an SDK, recompiled as v0 with a fresh blockhash and optional co-signers. */
export async function toV0(conn: Connection, tx: Transaction, payer: PublicKey, coSigners: Keypair[] = []): Promise<string> {
  const { blockhash } = await conn.getLatestBlockhash("confirmed");
  const message = new TransactionMessage({ payerKey: payer, recentBlockhash: blockhash, instructions: tx.instructions }).compileToV0Message();
  const v0 = new VersionedTransaction(message);
  if (coSigners.length) v0.sign(coSigners);
  return Buffer.from(v0.serialize()).toString("base64");
}

/** Whole tokens to base units, refusing anything that isn't a plain positive decimal. */
export function toUnits(amount: string, decimals: number): bigint {
  if (!/^\d+(\.\d+)?$/.test(amount)) throw new Error("Enter amounts as plain numbers.");
  const [w, f = ""] = amount.split(".");
  return BigInt(w) * BigInt(10) ** BigInt(decimals) + BigInt((f + "0".repeat(decimals)).slice(0, decimals));
}
