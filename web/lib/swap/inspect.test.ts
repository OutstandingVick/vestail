import assert from "node:assert/strict";
import { test } from "node:test";
import { Keypair, PublicKey, TransactionInstruction, TransactionMessage, VersionedTransaction } from "@solana/web3.js";

import { inspectSwapTransaction, LIQUIDITY_PROGRAMS, METEORA_DLMM_PROGRAM } from "./inspect.ts";

const taker = Keypair.generate().publicKey;
const TOKEN = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const tx = (ixs: TransactionInstruction[]) => new VersionedTransaction(new TransactionMessage({
  payerKey: taker, recentBlockhash: "11111111111111111111111111111111", instructions: ixs,
}).compileToV0Message());
const ix = (programId: PublicKey, data: number[], keys: PublicKey[] = []) =>
  new TransactionInstruction({ programId, data: Buffer.from(data), keys: keys.map(pubkey => ({ pubkey, isSigner: false, isWritable: true })) });
const opts = { taker: taker.toBase58(), maxLamportsFromTaker: BigInt(50_000_000) };
const dlmm = ix(new PublicKey(METEORA_DLMM_PROGRAM), [1, 2, 3]);

test("Meteora programs are refused by default", () => assert.equal(inspectSwapTransaction(tx([dlmm]), opts).ok, false));
test("Meteora programs pass when a liquidity transaction allows them", () =>
  assert.deepEqual(inspectSwapTransaction(tx([dlmm]), { ...opts, extraPrograms: LIQUIDITY_PROGRAMS }), { ok: true }));
test("allowing Meteora doesn't allow an unknown program", () =>
  assert.equal(inspectSwapTransaction(tx([dlmm, ix(Keypair.generate().publicKey, [0])]), { ...opts, extraPrograms: LIQUIDITY_PROGRAMS }).ok, false));
test("a token delegation is still refused in a liquidity transaction", () =>
  assert.match((inspectSwapTransaction(tx([dlmm, ix(TOKEN, [4])]), { ...opts, extraPrograms: LIQUIDITY_PROGRAMS }) as { reason: string }).reason, /delegate/));
test("closing an account to someone else is still refused", () => {
  const close = ix(TOKEN, [9], [Keypair.generate().publicKey, Keypair.generate().publicKey, taker]);
  assert.equal(inspectSwapTransaction(tx([dlmm, close]), { ...opts, extraPrograms: LIQUIDITY_PROGRAMS }).ok, false);
});
test("a transaction the buyer doesn't sign is refused", () =>
  assert.equal(inspectSwapTransaction(tx([dlmm]), { ...opts, taker: Keypair.generate().publicKey.toBase58(), extraPrograms: LIQUIDITY_PROGRAMS }).ok, false));
