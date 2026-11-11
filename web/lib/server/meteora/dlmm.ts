import "server-only";

import DLMM, { StrategyType } from "@meteora-ag/dlmm";
import { Keypair, PublicKey } from "@solana/web3.js";
import BN from "bn.js";

import { connection, toUnits, toV0 } from "./shared";

/** Bins on each side of the active bin for a new Spot position: a band around today's price. */
const BINS_EACH_SIDE = 10;
/** Slippage on the active bin, percent. Matches Vestail's swap ceiling. */
const SLIPPAGE_PCT = 1;

export interface DlmmPoolInfo { address: string; tokenX: string; tokenY: string; decimalsX: number; decimalsY: number; activeBinId: number }

export async function dlmmPool(pool: string): Promise<{ dlmm: DLMM; info: DlmmPoolInfo }> {
  const dlmm = await DLMM.create(connection(), new PublicKey(pool));
  const active = await dlmm.getActiveBin();
  return {
    dlmm,
    info: {
      address: pool, tokenX: dlmm.tokenX.publicKey.toBase58(), tokenY: dlmm.tokenY.publicKey.toBase58(),
      decimalsX: dlmm.tokenX.mint.decimals, decimalsY: dlmm.tokenY.mint.decimals, activeBinId: active.binId,
    },
  };
}

/**
 * A new Spot position around the active price, funded from the user's own
 * wallet. Returns the v0 transaction (co-signed only by the throwaway
 * position keypair) for the user to sign, and the new position's address.
 */
export async function buildDlmmAdd({ pool, user, mint, amountToken, amountQuote }: { pool: string; user: string; mint: string; amountToken: string; amountQuote: string }) {
  const { dlmm, info } = await dlmmPool(pool);
  // Pools list their two tokens in either order: map the user's amounts by mint, never by position.
  if (info.tokenX !== mint && info.tokenY !== mint) throw new Error("That pool doesn't hold this token.");
  const [amountX, amountY] = info.tokenX === mint ? [amountToken, amountQuote] : [amountQuote, amountToken];
  const owner = new PublicKey(user);
  const x = toUnits(amountX || "0", info.decimalsX), y = toUnits(amountY || "0", info.decimalsY);
  if (x === BigInt(0) && y === BigInt(0)) throw new Error("Enter an amount for at least one side.");
  const position = Keypair.generate();
  const tx = await dlmm.initializePositionAndAddLiquidityByStrategy({
    positionPubKey: position.publicKey, user: owner,
    totalXAmount: new BN(x.toString()), totalYAmount: new BN(y.toString()),
    strategy: { minBinId: info.activeBinId - BINS_EACH_SIDE, maxBinId: info.activeBinId + BINS_EACH_SIDE, strategyType: StrategyType.Spot },
    slippage: SLIPPAGE_PCT,
  });
  return { transactions: [await toV0(dlmm.program.provider.connection, tx, owner, [position])], position: position.publicKey.toBase58(), pool: info };
}

/** The user's positions in one DLMM pool, with their token amounts and unclaimed fees. */
export async function dlmmPositions({ pool, user }: { pool: string; user: string }) {
  const { dlmm, info } = await dlmmPool(pool);
  const { userPositions } = await dlmm.getPositionsByUserAndLbPair(new PublicKey(user));
  return {
    pool: info,
    positions: userPositions.map(p => ({
      address: p.publicKey.toBase58(),
      amountX: Number(p.positionData.totalXAmount) / 10 ** info.decimalsX,
      amountY: Number(p.positionData.totalYAmount) / 10 ** info.decimalsY,
      feeX: Number(p.positionData.feeX.toString()) / 10 ** info.decimalsX,
      feeY: Number(p.positionData.feeY.toString()) / 10 ** info.decimalsY,
      lowerBinId: p.positionData.lowerBinId, upperBinId: p.positionData.upperBinId,
    })),
  };
}

/**
 * Withdraw all of one position, claim its fees and close it, back to the
 * user's wallet. Only a position the user owns is found, so a position
 * address someone else owns can't be withdrawn through here.
 */
export async function buildDlmmRemove({ pool, user, position }: { pool: string; user: string; position: string }) {
  const { dlmm } = await dlmmPool(pool);
  const owner = new PublicKey(user);
  const { userPositions } = await dlmm.getPositionsByUserAndLbPair(owner);
  const found = userPositions.find(p => p.publicKey.toBase58() === position);
  if (!found) throw new Error("That position isn't yours in this pool.");
  const txs = await dlmm.removeLiquidity({
    user: owner, position: found.publicKey,
    fromBinId: found.positionData.lowerBinId, toBinId: found.positionData.upperBinId,
    bps: new BN(10_000), shouldClaimAndClose: true,
  });
  return { transactions: await Promise.all(txs.map(tx => toV0(dlmm.program.provider.connection, tx, owner))) };
}
