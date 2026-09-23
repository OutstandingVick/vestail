import { PublicKey, VersionedTransaction } from "@solana/web3.js";

/**
 * What a swap transaction from Jupiter is allowed to contain.
 *
 * Jupiter's response is untrusted input. It arrives over the network from a
 * third party, and the only thing standing between it and a user's signature
 * is this file. A transaction that asks for a token delegation, reassigns an
 * account's authority, or moves lamports somewhere unexpected is not a swap,
 * whatever the API that produced it says.
 *
 * Pure and synchronous: no network, no clock, no RPC. That is what lets it
 * run in both places it needs to — on the server before the transaction is
 * sent to the browser, and in the browser before the wallet is opened — and
 * what lets the tests build hostile transactions by hand.
 */

const SYSTEM_PROGRAM = "11111111111111111111111111111111";
const COMPUTE_BUDGET = "ComputeBudget111111111111111111111111111111";
const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const TOKEN_2022_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";
const ASSOCIATED_TOKEN = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
const MEMO_PROGRAM = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";
const MEMO_PROGRAM_V1 = "Memo1UhkJRfHyvLMcVucJwxXeuD728EqVDDwQDxFMNo";
/** Jupiter's aggregator program: the one that actually routes the swap. */
const JUPITER_V6 = "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4";

/** Top-level programs a Jupiter swap legitimately touches. */
export const ALLOWED_PROGRAMS: readonly string[] = [
  SYSTEM_PROGRAM,
  COMPUTE_BUDGET,
  TOKEN_PROGRAM,
  TOKEN_2022_PROGRAM,
  ASSOCIATED_TOKEN,
  MEMO_PROGRAM,
  MEMO_PROGRAM_V1,
  JUPITER_V6,
];

/**
 * SPL Token instructions Vestail will never send, by their discriminator.
 *
 * Approve and ApproveChecked are the important ones: a delegation survives
 * the transaction, so a user who signs one can be drained hours later, with
 * nothing on screen at the time to show it happened.
 */
const FORBIDDEN_TOKEN_IX: Record<number, string> = {
  2: "set up a multisig authority",
  4: "grant a delegate over your tokens",
  5: "revoke a delegate",
  6: "reassign an account's authority",
  7: "mint tokens",
  8: "burn your tokens",
  10: "freeze an account",
  13: "grant a delegate over your tokens",
  14: "mint tokens",
  15: "burn your tokens",
};

const TOKEN_CLOSE_ACCOUNT = 9;

/** System instructions, as the first four bytes of the data, little-endian. */
const SYSTEM_TRANSFER = 2;
const SYSTEM_TRANSFER_WITH_SEED = 11;
const ALLOWED_SYSTEM_IX = new Set([
  0, // CreateAccount
  1, // Assign
  SYSTEM_TRANSFER,
  3, // CreateAccountWithSeed
  8, // Allocate
  9, // AllocateWithSeed
  10, // AssignWithSeed
  SYSTEM_TRANSFER_WITH_SEED,
]);

export interface InspectOptions {
  /** The wallet that will sign. Base58. */
  taker: string;
  /**
   * The most lamports this transaction may move out of the taker's own
   * account: what they are paying when paying in SOL, plus an allowance for
   * rent on the token accounts the swap opens and for fees.
   */
  maxLamportsFromTaker: bigint;
}

export type Inspection = { ok: true } | { ok: false; reason: string };

function readU32(data: Uint8Array, offset: number): number {
  return new DataView(data.buffer, data.byteOffset + offset, 4).getUint32(0, true);
}

function readU64(data: Uint8Array, offset: number): bigint {
  return new DataView(data.buffer, data.byteOffset + offset, 8).getBigUint64(0, true);
}

/**
 * Check a swap transaction before anyone signs it.
 *
 * Program ids are read from the message's static keys, which is the only
 * place they can be: Solana forbids a transaction from taking a program id
 * out of an address lookup table, so nothing can be hidden from this check
 * by putting it in one.
 */
export function inspectSwapTransaction(
  tx: VersionedTransaction,
  { taker, maxLamportsFromTaker }: InspectOptions,
): Inspection {
  const message = tx.message;
  if (message.version !== 0) {
    return { ok: false, reason: "The swap came back in an unexpected transaction format." };
  }

  const keys = message.staticAccountKeys.map((k: PublicKey) => k.toBase58());
  const signers = keys.slice(0, message.header.numRequiredSignatures);
  if (!signers.includes(taker)) {
    return { ok: false, reason: "This transaction is not for your wallet." };
  }

  let lamportsFromTaker = BigInt(0);

  for (const ix of message.compiledInstructions) {
    const programId = keys[ix.programIdIndex];
    if (programId === undefined) {
      return { ok: false, reason: "The swap refers to a program it did not name." };
    }
    if (!ALLOWED_PROGRAMS.includes(programId)) {
      return {
        ok: false,
        reason: `The swap wants to call an unexpected program (${programId.slice(0, 8)}…).`,
      };
    }

    const data = ix.data;
    const account = (i: number) => keys[ix.accountKeyIndexes[i]];

    if (programId === TOKEN_PROGRAM || programId === TOKEN_2022_PROGRAM) {
      if (data.length === 0) continue;
      const forbidden = FORBIDDEN_TOKEN_IX[data[0]];
      if (forbidden) {
        return { ok: false, reason: `The swap wants to ${forbidden}. Vestail never does that.` };
      }
      if (data[0] === TOKEN_CLOSE_ACCOUNT) {
        // Unwrapping wrapped SOL closes an account and returns its lamports.
        // That is fine when they come back to the person paying, and is a
        // way to take their rent otherwise.
        const destination = account(1);
        if (destination !== taker) {
          return { ok: false, reason: "The swap wants to send a closed account's balance elsewhere." };
        }
      }
      continue;
    }

    if (programId === SYSTEM_PROGRAM) {
      if (data.length < 4) {
        return { ok: false, reason: "The swap contains a malformed system instruction." };
      }
      const kind = readU32(data, 0);
      if (!ALLOWED_SYSTEM_IX.has(kind)) {
        return { ok: false, reason: "The swap contains an unexpected system instruction." };
      }
      if (kind === SYSTEM_TRANSFER || kind === SYSTEM_TRANSFER_WITH_SEED) {
        // Only the taker's own lamports are worth bounding; a transfer out
        // of anyone else's account cannot cost them anything.
        if (account(0) === taker && data.length >= 12) {
          lamportsFromTaker += readU64(data, 4);
        }
      }
      continue;
    }
  }

  if (lamportsFromTaker > maxLamportsFromTaker) {
    return {
      ok: false,
      reason: "The swap wants to move more SOL out of your wallet than this purchase should cost.",
    };
  }

  return { ok: true };
}

/**
 * How many lamports a purchase of `amount` may legitimately take out of the
 * taker's own account.
 *
 * Paying in SOL means the amount itself leaves as lamports, wrapped inside
 * the transaction. Paying in USDC means none of it should, beyond the
 * incidental costs every swap has: rent for any token account the swap opens,
 * and the fees. 0.05 SOL covers about twenty new accounts, so it is generous
 * as a ceiling and still far below anything worth stealing.
 */
export const MAX_INCIDENTAL_LAMPORTS = BigInt(50_000_000);

export function maxLamportsFor(inputMint: string, amount: bigint, wsolMint: string): bigint {
  return (inputMint === wsolMint ? amount : BigInt(0)) + MAX_INCIDENTAL_LAMPORTS;
}
