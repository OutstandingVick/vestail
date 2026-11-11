import { VersionedTransaction } from "@solana/web3.js";
import { NextResponse } from "next/server";
import { z } from "zod";

import { api, ApiError } from "@/lib/server/api";
import { buildDammAdd, buildDammRemove, dammPositions } from "@/lib/server/meteora/damm";
import { buildDlmmAdd, buildDlmmRemove, dlmmPositions } from "@/lib/server/meteora/dlmm";
import { userFrom } from "@/lib/server/privy";
import { readProfile } from "@/lib/server/profile";
import { solanaWalletsOf } from "@/lib/server/wallets";
import { inspectSwapTransaction, LIQUIDITY_PROGRAMS } from "@/lib/swap/inspect";
import { canAct } from "@/lib/utilities";

/**
 * POST /api/earn — Meteora liquidity for the signed-in user's own wallet.
 *   action "positions": the user's positions in a pool.
 *   action "add": a deposit. Re-reads the earn verdict for the declared
 *     country; needs it enabled and the risk acknowledged.
 *   action "remove": a full withdrawal. Never blocked by a verdict, so a
 *     user's funds can't be trapped by a rule change.
 * The pool must be one Vestail lists for that token (USDC/SOL pairs only),
 * the wallet must be linked to the user, and every transaction is inspected
 * before it's returned. The user signs; Vestail holds nothing.
 */
const Body = z.object({
  action: z.enum(["positions", "add", "remove"]),
  symbol: z.string().min(1).max(12),
  mint: z.string().min(32).max(44),
  pool: z.string().min(32).max(44),
  wallet: z.string().min(32).max(44),
  amountToken: z.string().max(24).optional(),
  amountQuote: z.string().max(24).optional(),
  position: z.string().min(32).max(44).optional(),
  acknowledged: z.boolean().optional(),
});
const fail = (status: number, error: string) => NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  const userId = await userFrom(request);
  if (!userId) return fail(401, "Sign in first.");
  const profile = await readProfile();
  if (!profile) return fail(400, "Choose your country first.");
  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "Invalid request.");
  const b = parsed.data;
  if (!(await solanaWalletsOf(userId)).includes(b.wallet)) return fail(403, "That wallet isn't linked to your account.");

  let earn;
  try {
    const data = await api.utilities(b.symbol, profile.country, profile.who);
    earn = data.versions.find(v => v.asset.id === b.mint)?.utilities.find(u => u.utility === "earn")?.options.find(o => o.protocol === "meteora");
  } catch (e) {
    return fail(e instanceof ApiError ? 400 : 502, "Couldn't check the earn verdict.");
  }
  if (!earn) return fail(404, "Earning isn't offered for this token.");
  const pool = earn.live?.pools?.find(p => p.address === b.pool);
  // Withdrawals only need the pool to be one of this token's; deposits also need the pool listed now.
  if (!pool && b.action === "add") return fail(403, "Vestail only routes deposits into the USDC and SOL pools it lists for this token.");
  const kind = pool?.kind ?? "dlmm";

  try {
    if (b.action === "positions") {
      const positions = kind === "dlmm" ? (await dlmmPositions({ pool: b.pool, user: b.wallet })).positions : await dammPositions({ pool: b.pool, user: b.wallet });
      return NextResponse.json({ positions }, { headers: { "Cache-Control": "no-store" } });
    }
    if (b.action === "add" && !canAct(earn, b.acknowledged === true)) {
      return fail(403, earn.actionsEnabled ? "Acknowledge the impermanent-loss risk first." : "Earning isn't allowed for your declared country.");
    }
    const built = b.action === "add"
      ? (kind === "dlmm"
        ? await buildDlmmAdd({ pool: b.pool, user: b.wallet, mint: b.mint, amountToken: b.amountToken ?? "0", amountQuote: b.amountQuote ?? "0" })
        : await buildDammAdd({ pool: b.pool, user: b.wallet, mint: b.mint, amountToken: b.amountToken ?? "0", amountQuote: b.amountQuote ?? "0" }))
      : (kind === "dlmm"
        ? await buildDlmmRemove({ pool: b.pool, user: b.wallet, position: b.position ?? "" })
        : await buildDammRemove({ pool: b.pool, user: b.wallet, position: b.position ?? "" }));

    // Inspect before returning: Meteora, token, ATA, system and compute-budget programs only; no delegation.
    const solIn = pool?.pair === "SOL" && b.action === "add" ? BigInt(Math.ceil(Number(b.amountQuote || "0") * 1e9)) : BigInt(0);
    for (const tx of built.transactions) {
      const inspection = inspectSwapTransaction(VersionedTransaction.deserialize(Buffer.from(tx, "base64")), {
        taker: b.wallet, maxLamportsFromTaker: solIn + BigInt(100_000_000), extraPrograms: LIQUIDITY_PROGRAMS,
      });
      if (!inspection.ok) return fail(502, inspection.reason);
    }
    return NextResponse.json({ ...built, kind }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    return fail(422, e instanceof Error ? e.message : "Couldn't build this.");
  }
}

