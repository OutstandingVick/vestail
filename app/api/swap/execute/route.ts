import { NextResponse } from "next/server";
import { z } from "zod";

import { executeOrder } from "@/lib/server/jupiterSwap";
import { orderSigningReady, verifyOrder } from "@/lib/server/orderToken";
import type { SwapResult } from "@/lib/types";

/**
 * POST /api/swap/execute { signedTransaction, requestId, orderToken }
 *
 * Forwards a transaction the user signed in their own wallet to Jupiter for
 * landing. Only orders issued by /api/swap/order — and therefore already
 * checked for eligibility — are accepted: orderToken proves it.
 */

const BodySchema = z.object({
  // A v0 transaction is at most 1232 bytes; base64 of that is under 1700.
  signedTransaction: z.string().min(1).max(2000).regex(/^[A-Za-z0-9+/]+=*$/),
  requestId: z.string().min(1).max(100),
  orderToken: z.string().min(1).max(200),
});

const EXECUTE_ERRORS: Record<number, string> = {
  [-1]: "The quote expired before it was sent. Get a new quote and try again.",
  [-2]: "The signed transaction was invalid.",
  [-3]: "The signed transaction was invalid.",
  [-1000]: "The transaction did not land. Nothing was spent; try again.",
  [-1003]: "The transaction was not fully signed.",
  [-1004]: "The quote expired before it landed. Get a new quote and try again.",
  [-2000]: "The transaction did not land. Nothing was spent; try again.",
  [-2003]: "The market maker's quote expired. Get a new quote and try again.",
  [-2004]: "The market maker rejected the swap. Get a new quote and try again.",
};

function fail(status: number, error: string) {
  return NextResponse.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  if (!orderSigningReady()) {
    return fail(503, "Swaps are not configured on this server: VESTAIL_ORDER_SECRET is missing.");
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return fail(400, "Invalid execute request.");
  const { signedTransaction, requestId, orderToken } = parsed.data;

  if (!verifyOrder(orderToken, requestId)) {
    return fail(403, "This order was not issued by Vestail, or it has expired.");
  }

  const result = await executeOrder({ signedTransaction, requestId });

  // Jupiter reports some execute failures as HTTP 4xx with a JSON body such
  // as { code: -1003, error: "Transaction not fully signed" }. Those are swap
  // outcomes, not transport errors, so they get the same shape as a landed
  // failure and the same user-facing message table.
  if (!result.ok) {
    const b = result.body as { code?: unknown; error?: unknown } | undefined;
    if (result.status !== 429 && typeof b?.code === "number") {
      const failed: SwapResult = {
        status: "Failed",
        signature: null,
        code: b.code,
        totalInputAmount: null,
        totalOutputAmount: null,
        message:
          EXECUTE_ERRORS[b.code] ??
          (typeof b.error === "string" ? b.error : "The swap failed."),
      };
      return NextResponse.json(failed, { headers: { "Cache-Control": "no-store" } });
    }
    return fail(result.status === 429 ? 429 : 502, result.message);
  }
  const r = result.data;

  const body: SwapResult = {
    status: r.status,
    signature: r.signature ?? null,
    code: r.code,
    totalInputAmount: r.totalInputAmount ?? null,
    totalOutputAmount: r.totalOutputAmount ?? null,
    message:
      r.status === "Success"
        ? null
        : EXECUTE_ERRORS[r.code] ?? r.error ?? "The swap failed.",
  };

  return NextResponse.json(body, { headers: { "Cache-Control": "no-store" } });
}
