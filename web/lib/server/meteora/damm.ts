import "server-only";

import { CpAmm, getCurrentPoint, getTokenProgram } from "@meteora-ag/cp-amm-sdk";
import { getMint } from "@solana/spl-token";
import { Keypair, PublicKey } from "@solana/web3.js";
import BN from "bn.js";

import { connection, toUnits, toV0 } from "./shared";

const MIN_OUT_BPS = 9_700;

type PoolState = Awaited<ReturnType<CpAmm["fetchPoolState"]>>;
const withdrawQuote = (amm: CpAmm, state: PoolState, liquidityDelta: BN) => amm.getWithdrawQuote({
  liquidityDelta, sqrtPrice: state.sqrtPrice, minSqrtPrice: state.sqrtMinPrice, maxSqrtPrice: state.sqrtMaxPrice,
  collectFeeMode: state.collectFeeMode, tokenAAmount: state.tokenAAmount, tokenBAmount: state.tokenBAmount, liquidity: state.liquidity,
});

async function poolContext(pool: string) {
  const conn = connection();
  const amm = new CpAmm(conn);
  const state = await amm.fetchPoolState(new PublicKey(pool));
  const programA = getTokenProgram(state.tokenAFlag), programB = getTokenProgram(state.tokenBFlag);
  const [mintA, mintB] = await Promise.all([getMint(conn, state.tokenAMint, "confirmed", programA), getMint(conn, state.tokenBMint, "confirmed", programB)]);
  return { conn, amm, state, programA, programB, decimalsA: mintA.decimals, decimalsB: mintB.decimals };
}

export async function buildDammAdd({ pool, user, mint, amountToken, amountQuote }: { pool: string; user: string; mint: string; amountToken: string; amountQuote: string }) {
  const { conn, amm, state, programA, programB, decimalsA, decimalsB } = await poolContext(pool);
  // Pools list their two tokens in either order: map the user's amounts by mint, never by position.
  const isA = state.tokenAMint.toBase58() === mint;
  if (!isA && state.tokenBMint.toBase58() !== mint) throw new Error("That pool doesn't hold this token.");
  const [amountA, amountB] = isA ? [amountToken, amountQuote] : [amountQuote, amountToken];
  const owner = new PublicKey(user);
  const maxA = new BN(toUnits(amountA || "0", decimalsA).toString()), maxB = new BN(toUnits(amountB || "0", decimalsB).toString());
  if (maxA.isZero() && maxB.isZero()) throw new Error("Enter an amount for at least one side.");
  const liquidityDelta = amm.getLiquidityDelta({
    maxAmountTokenA: maxA, maxAmountTokenB: maxB, sqrtPrice: state.sqrtPrice, sqrtMinPrice: state.sqrtMinPrice, sqrtMaxPrice: state.sqrtMaxPrice,
    collectFeeMode: state.collectFeeMode, tokenAAmount: state.tokenAAmount, tokenBAmount: state.tokenBAmount, liquidity: state.liquidity,
  });
  const positionNft = Keypair.generate();
  const tx = await amm.createPositionAndAddLiquidity({
    owner, pool: new PublicKey(pool), positionNft: positionNft.publicKey, liquidityDelta,
    maxAmountTokenA: maxA, maxAmountTokenB: maxB,
    // Never spend more than the user typed on either side.
    tokenAAmountThreshold: maxA, tokenBAmountThreshold: maxB,
    tokenAMint: state.tokenAMint, tokenBMint: state.tokenBMint, tokenAProgram: programA, tokenBProgram: programB,
  });
  return { transactions: [await toV0(conn, tx, owner, [positionNft])], position: positionNft.publicKey.toBase58() };
}

export async function dammPositions({ pool, user }: { pool: string; user: string }) {
  const { amm, state, decimalsA, decimalsB } = await poolContext(pool);
  const mine = (await amm.getPositionsByUser(new PublicKey(user))).filter(p => p.positionState.pool.toBase58() === pool);
  return mine.map(p => {
    const q = withdrawQuote(amm, state, p.positionState.unlockedLiquidity);
    return { address: p.position.toBase58(), amountA: Number(q.outAmountA.toString()) / 10 ** decimalsA, amountB: Number(q.outAmountB.toString()) / 10 ** decimalsB };
  });
}

export async function buildDammRemove({ pool, user, position }: { pool: string; user: string; position: string }) {
  const { conn, amm, state } = await poolContext(pool);
  const owner = new PublicKey(user);
  const found = (await amm.getPositionsByUser(owner)).find(p => p.position.toBase58() === position && p.positionState.pool.toBase58() === pool);
  if (!found) throw new Error("That position isn't yours in this pool.");
  const q = withdrawQuote(amm, state, found.positionState.unlockedLiquidity);
  const min = (n: BN) => n.muln(MIN_OUT_BPS).divn(10_000);
  const tx = await amm.removeAllLiquidityAndClosePosition({
    owner, position: found.position, positionNftAccount: found.positionNftAccount,
    poolState: state, positionState: found.positionState,
    tokenAAmountThreshold: min(q.outAmountA), tokenBAmountThreshold: min(q.outAmountB),
    vestings: (await amm.getAllVestingsByPosition(found.position)).map(v => ({ account: v.publicKey, vestingState: v.account })),
    currentPoint: await getCurrentPoint(conn, state.activationType),
  });
  return { transactions: [await toV0(conn, tx, owner)] };
}
