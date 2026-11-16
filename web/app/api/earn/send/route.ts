import { VersionedTransaction } from "@solana/web3.js";
import { NextResponse } from "next/server";
import { z } from "zod";

import { connection } from "@/lib/server/meteora/shared";
import { userFrom } from "@/lib/server/privy";
import { solanaWalletsOf } from "@/lib/server/wallets";
import { inspectSwapTransaction, LIQUIDITY_PROGRAMS } from "@/lib/swap/inspect";

const Body = z.object({ transaction: z.string().min(1).max(2400).regex(/^[A-Za-z0-9+/]+=*$/), wallet: z.string().min(32).max(44) });
const fail = (status: number, error: string) => NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const userId = await userFrom(request);
  if (!userId) return fail(401, "Sign in first.");
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "Invalid request.");
  const { transaction, wallet } = parsed.data;
  if (!(await solanaWalletsOf(userId)).includes(wallet)) return fail(403, "That wallet isn't linked to your account.");

  let tx: VersionedTransaction;
  try { tx = VersionedTransaction.deserialize(Buffer.from(transaction, "base64")); } catch { return fail(400, "That isn't a transaction."); }
  const inspection = inspectSwapTransaction(tx, { taker: wallet, maxLamportsFromTaker: BigInt(100_000_000_000), extraPrograms: LIQUIDITY_PROGRAMS });
  if (!inspection.ok) return fail(403, inspection.reason);

  try {
    const signature = await connection().sendRawTransaction(tx.serialize(), { skipPreflight: false, maxRetries: 3 });
    return NextResponse.json({ signature }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return fail(422, e instanceof Error ? e.message.split("\n")[0] : "The network rejected the transaction.");
  }
}
