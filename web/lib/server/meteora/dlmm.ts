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
export async function buildDlmmAdd({ pool, user, amountX, amountY }: { pool: string; user: string; amountX: string; amountY: string }) {
  const { dlmm, info } = await dlmmPool(pool);
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
