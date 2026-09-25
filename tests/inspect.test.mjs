import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";

const { inspectSwapTransaction } = await import(
  new URL("../lib/swap/inspect.ts", import.meta.url)
);

const TOKEN = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const TOKEN_2022 = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
const JUPITER = new PublicKey("JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4");
const JUPITER_Z = new PublicKey("61DFfeTKM7trxYcPQCM78bJ794ddZprZpAwAnLiwTpYH");
const COMPUTE_BUDGET = new PublicKey("ComputeBudget111111111111111111111111111111");

const taker = Keypair.generate().publicKey;
const stranger = Keypair.generate().publicKey;
const someAccount = Keypair.generate().publicKey;
const blockhash = "11111111111111111111111111111111";

/** A cap generous enough for rent and fees, as a USDC purchase would use. */
const RENT_ALLOWANCE = BigInt(50_000_000);

function tx(instructions, payer = taker) {
  const message = new TransactionMessage({
    payerKey: payer,
    recentBlockhash: blockhash,
    instructions,
  }).compileToV0Message();
  return new VersionedTransaction(message);
}

/** A raw SPL Token instruction: discriminator, then whatever else it needs. */
function tokenIx(discriminator, accounts, rest = [], programId = TOKEN) {
  return new TransactionInstruction({
    programId,
    keys: accounts.map((pubkey) => ({ pubkey, isSigner: false, isWritable: true })),
    data: Buffer.from([discriminator, ...rest]),
  });
}

const route = new TransactionInstruction({
  programId: JUPITER,
  keys: [{ pubkey: taker, isSigner: true, isWritable: true }],
  data: Buffer.from([1, 2, 3, 4]),
});

const budget = new TransactionInstruction({
  programId: COMPUTE_BUDGET,
  keys: [],
  data: Buffer.from([2, 0, 0, 0, 0]),
});

const check = (transaction, max = RENT_ALLOWANCE) =>
  inspectSwapTransaction(transaction, {
    taker: taker.toBase58(),
    maxLamportsFromTaker: max,
  });

describe("swap transaction inspection", () => {
  it("accepts an ordinary swap", () => {
    assert.deepEqual(check(tx([budget, route])), { ok: true });
  });

  it("accepts the order engine a real gasless swap is filled through", () => {
    // What Jupiter actually returns for these pairs: compute budget, an
    // associated-token-account create, and the JupiterZ order engine.
    const fill = new TransactionInstruction({
      programId: JUPITER_Z,
      keys: [{ pubkey: taker, isSigner: true, isWritable: true }],
      data: Buffer.from([168, 1, 2, 3]),
    });
    assert.deepEqual(check(tx([budget, fill])), { ok: true });
  });

  it("accepts a token transfer, which is what a swap is made of", () => {
    assert.equal(check(tx([route, tokenIx(3, [someAccount, someAccount, taker])])).ok, true);
  });

  it("accepts Token-2022 as well as the original token program", () => {
    assert.equal(
      check(tx([route, tokenIx(12, [someAccount, someAccount, taker], [], TOKEN_2022)])).ok,
      true,
    );
  });

  it("refuses a program it does not expect", () => {
    const evil = new TransactionInstruction({
      programId: Keypair.generate().publicKey,
      keys: [{ pubkey: taker, isSigner: true, isWritable: true }],
      data: Buffer.from([0]),
    });
    const result = check(tx([route, evil]));
    assert.equal(result.ok, false);
    assert.match(result.reason, /unexpected program/);
  });

  for (const [name, discriminator] of [
    ["Approve", 4],
    ["ApproveChecked", 13],
    ["Revoke", 5],
    ["SetAuthority", 6],
    ["Burn", 8],
    ["BurnChecked", 15],
    ["MintTo", 7],
    ["MintToChecked", 14],
    ["FreezeAccount", 10],
    ["InitializeMultisig", 2],
  ]) {
    it(`refuses ${name}`, () => {
      const result = check(tx([route, tokenIx(discriminator, [someAccount, stranger, taker])]));
      assert.equal(result.ok, false, `${name} was allowed`);
    });
  }

  it("refuses a delegation hidden behind Token-2022", () => {
    const result = check(
      tx([route, tokenIx(4, [someAccount, stranger, taker], [], TOKEN_2022)]),
    );
    assert.equal(result.ok, false);
    assert.match(result.reason, /delegate/);
  });

  it("accepts closing an account back to the payer, which is how SOL unwraps", () => {
    assert.equal(check(tx([route, tokenIx(9, [someAccount, taker, taker])])).ok, true);
  });

  it("refuses closing an account to anyone else", () => {
    const result = check(tx([route, tokenIx(9, [someAccount, stranger, taker])]));
    assert.equal(result.ok, false);
    assert.match(result.reason, /closed account/);
  });

  it("accepts wrapping SOL within the amount being spent", () => {
    const wrap = SystemProgram.transfer({
      fromPubkey: taker,
      toPubkey: someAccount,
      lamports: 40_000_000,
    });
    assert.equal(check(tx([route, wrap])).ok, true);
  });

  it("refuses moving more of the payer's SOL than the purchase should cost", () => {
    const drain = SystemProgram.transfer({
      fromPubkey: taker,
      toPubkey: stranger,
      lamports: 900_000_000,
    });
    const result = check(tx([route, drain]));
    assert.equal(result.ok, false);
    assert.match(result.reason, /more SOL/);
  });

  it("adds transfers up rather than checking them one at a time", () => {
    const half = () =>
      SystemProgram.transfer({ fromPubkey: taker, toPubkey: stranger, lamports: 30_000_000 });
    const result = check(tx([route, half(), half()]));
    assert.equal(result.ok, false);
  });

  it("ignores lamports leaving an account that is not the payer's", () => {
    const other = SystemProgram.transfer({
      fromPubkey: stranger,
      toPubkey: stranger,
      lamports: 900_000_000,
    });
    assert.equal(check(tx([route, other], taker)).ok, true);
  });

  it("refuses a system instruction that is not part of a swap", () => {
    const advanceNonce = new TransactionInstruction({
      programId: SystemProgram.programId,
      keys: [{ pubkey: someAccount, isSigner: false, isWritable: true }],
      data: Buffer.from([4, 0, 0, 0]),
    });
    const result = check(tx([route, advanceNonce]));
    assert.equal(result.ok, false);
    assert.match(result.reason, /unexpected system instruction/);
  });

  it("refuses a malformed system instruction", () => {
    const stub = new TransactionInstruction({
      programId: SystemProgram.programId,
      keys: [],
      data: Buffer.from([2]),
    });
    const result = check(tx([route, stub]));
    assert.equal(result.ok, false);
    assert.match(result.reason, /malformed/);
  });

  it("refuses a transaction the wallet is not required to sign", () => {
    const other = Keypair.generate().publicKey;
    const message = new TransactionMessage({
      payerKey: other,
      recentBlockhash: blockhash,
      instructions: [
        new TransactionInstruction({
          programId: JUPITER,
          keys: [{ pubkey: other, isSigner: true, isWritable: true }],
          data: Buffer.from([1]),
        }),
      ],
    }).compileToV0Message();
    const result = check(new VersionedTransaction(message));
    assert.equal(result.ok, false);
    assert.match(result.reason, /not for your wallet/);
  });

  it("refuses a legacy transaction, which Jupiter does not send", () => {
    const legacy = new TransactionMessage({
      payerKey: taker,
      recentBlockhash: blockhash,
      instructions: [route],
    }).compileToLegacyMessage();
    const result = check(new VersionedTransaction(legacy));
    assert.equal(result.ok, false);
    assert.match(result.reason, /unexpected transaction format/);
  });
});
