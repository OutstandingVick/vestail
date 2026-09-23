"use client";

import Image from "next/image";

import { Icon } from "@/components/icons";
import { fromBaseUnits, sanitizeAmount } from "@/lib/amounts";
import { impactWarning } from "@/lib/app/priceImpact";
import { PAY_TOKENS, type AllowedSymbol, type PayTokenSymbol } from "@/lib/constants";
import { formatUsdc } from "@/lib/format";
import type { SwapQuote } from "@/lib/types";
import type { EstimateState } from "@/hooks/useEstimate";

import { Monogram } from "./Selectors";

/** The version shown in the "You get" pill, set by the version cards. */
export interface SelectedVersion {
  symbol: AllowedSymbol;
  tokenSymbol: string;
  providerName: string;
  decimals: number;
}

export function SwapPanel({
  payToken,
  onPayTokenChange,
  amount,
  onAmountChange,
  balance,
  onMax,
  selected,
  estimate,
  confirmed = false,
  payAmount,
}: {
  payToken: PayTokenSymbol;
  onPayTokenChange: (token: PayTokenSymbol) => void;
  amount: string;
  onAmountChange: (amount: string) => void;
  /** Balance of the pay token; null when no wallet is connected. */
  balance: number | null;
  onMax: () => void;
  selected: SelectedVersion | null;
  estimate: EstimateState;
  /**
   * True once `estimate` is the order in the user's wallet rather than a
   * price fetched without one.
   */
  confirmed?: boolean;
  /** The amount being paid, in base units, for the impact warning. */
  payAmount: bigint | null;
}) {
  const other: PayTokenSymbol = payToken === "USDC" ? "SOL" : "USDC";

  return (
    <div className="relative">
      {/* You pay */}
      <div className="rounded-2xl bg-white/[0.07] p-5">
        <label htmlFor="pay-amount" className="text-sm font-semibold text-white/80">
          You pay
        </label>
        <div className="mt-3 flex items-center gap-3">
          <input
            id="pay-amount"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.0"
            value={amount}
            onChange={(e) =>
              onAmountChange(sanitizeAmount(e.target.value, PAY_TOKENS[payToken].decimals))
            }
            className="min-w-0 flex-1 bg-transparent text-4xl font-semibold text-white outline-none placeholder:text-white/30"
          />
          <button
            type="button"
            onClick={() => onPayTokenChange(other)}
            aria-label={`Paying with ${payToken}. Switch to ${other}.`}
            className="flex shrink-0 items-center gap-2 rounded-full bg-white/[0.08] py-2 pl-2 pr-3 text-base font-semibold text-white ring-1 ring-white/10 transition-colors hover:bg-white/[0.12] focus-visible:outline-2 focus-visible:outline-brand-orange"
          >
            <PayTokenGlyph token={payToken} />
            {payToken}
            <Icon name="chevron-updown" className="size-4 text-white/60" />
          </button>
        </div>
        {balance !== null && (
          <div className="mt-3 flex items-center justify-end gap-2 text-sm text-white/60">
            <span>
              Balance {payToken === "USDC" ? formatUsdc(balance) : balance.toFixed(4)} {payToken}
            </span>
            <button
              type="button"
              onClick={onMax}
              className="rounded-md px-2 py-0.5 text-xs font-bold text-brand-orange ring-1 ring-brand-orange/50 transition-colors hover:bg-brand-orange/10 focus-visible:outline-2 focus-visible:outline-brand-orange"
            >
              MAX
            </button>
          </div>
        )}
      </div>

      {/* Direction: buy-only in Phase 1, shown so the layout reads as a swap. */}
      <div className="relative z-10 -my-3 flex justify-center">
        <span className="group relative">
          <button
            type="button"
            aria-disabled="true"
            aria-describedby="sell-soon"
            onClick={(e) => e.preventDefault()}
            className="flex size-11 cursor-not-allowed items-center justify-center rounded-full bg-[#101631] text-white/40 ring-4 ring-[#0b1026] focus-visible:outline-2 focus-visible:outline-brand-orange"
          >
            <Icon name="swap-vertical" className="size-5" />
            <span className="sr-only">Swap direction</span>
          </button>
          <span
            id="sell-soon"
            role="tooltip"
            className="pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-white px-2 py-1 text-xs font-semibold text-brand-navy opacity-0 shadow group-focus-within:opacity-100 group-hover:opacity-100 motion-safe:transition-opacity"
          >
            Selling coming soon
          </span>
        </span>
      </div>

      {/* You get */}
      <div className="rounded-2xl p-5 ring-1 ring-white/12">
        <p className="text-sm font-semibold text-white/80">
          You get{confirmed ? " — the order in your wallet" : ""}
        </p>
        <div className="mt-3 flex items-center gap-3">
          <div className="min-w-0 flex-1" aria-live="polite">
            <EstimateAmount estimate={estimate} selected={selected} />
          </div>
          <VersionPill selected={selected} />
        </div>
        {estimate.status === "ready" && selected && (
          <Guarantee quote={estimate.quote} selected={selected} confirmed={confirmed} />
        )}
        {estimate.status === "ready" && (
          <ImpactNote quote={estimate.quote} payToken={payToken} payAmount={payAmount} />
        )}
      </div>
    </div>
  );
}

function EstimateAmount({
  estimate,
  selected,
}: {
  estimate: EstimateState;
  selected: SelectedVersion | null;
}) {
  if (estimate.status === "loading") {
    return (
      <span className="block h-10 w-32 rounded-lg bg-white/10 motion-safe:animate-pulse">
        <span className="sr-only">Finding a price…</span>
      </span>
    );
  }
  if (estimate.status === "ready" && selected) {
    const out = fromBaseUnits(estimate.quote.outAmount, selected.decimals);
    // Six significant decimals is plenty for a share-sized token.
    const [whole, frac = ""] = out.split(".");
    return (
      <span className="block truncate text-3xl font-semibold text-white sm:text-4xl">
        {frac ? `${whole}.${frac.slice(0, 6)}` : whole}
      </span>
    );
  }
  if (estimate.status === "no_route") {
    return (
      <span className="block text-sm leading-snug text-white/75">
        No route for this amount right now. Try a smaller amount, or pay with the other token.
      </span>
    );
  }
  if (estimate.status === "error") {
    return <span className="block text-sm leading-snug text-white/75">{estimate.message}</span>;
  }
  return <span className="block text-3xl font-semibold text-white/30 sm:text-4xl">0.0</span>;
}

/**
 * The floor under the number above it: what the swap will not go below.
 *
 * Only shown once there is an order, and only when there is slippage to
 * speak of — a firm market-maker quote comes back at zero, and "at least"
 * the exact amount is noise.
 */
function Guarantee({
  quote,
  selected,
  confirmed,
}: {
  quote: SwapQuote;
  selected: SelectedVersion;
  confirmed: boolean;
}) {
  const slippage = quote.slippageBps ?? 0;
  if (!confirmed || slippage <= 0) return null;

  const out = BigInt(quote.outAmount);
  const floor = (out * BigInt(10_000 - slippage)) / BigInt(10_000);
  return (
    <p className="mt-2 text-sm text-white/60">
      At least {fromBaseUnits(floor, selected.decimals)} {selected.tokenSymbol} after
      slippage, or the swap fails and nothing is spent.
    </p>
  );
}

/**
 * What this route costs to enter, when that is worth saying.
 *
 * Orange, not a verdict colour: a thin market is not a jurisdiction, and
 * the three verdict hues mean one thing each.
 */
function ImpactNote({
  quote,
  payToken,
  payAmount,
}: {
  quote: SwapQuote;
  payToken: PayTokenSymbol;
  payAmount: bigint | null;
}) {
  const warning = impactWarning(quote.priceImpactPct, payAmount);
  if (!warning) return null;

  // "Roughly" and six decimal places do not belong in the same sentence:
  // USDC reads as money, SOL to four places, which is how the balance above
  // is written too.
  const decimals = PAY_TOKENS[payToken].decimals;
  const whole = Number(warning.costUnits) / 10 ** decimals;
  const cost = payToken === "USDC" ? formatUsdc(whole) : whole.toFixed(4);

  return (
    <p className="mt-3 rounded-xl bg-brand-orange/10 px-3 py-2 text-sm leading-relaxed text-brand-orange ring-1 ring-brand-orange/40">
      This version costs about {warning.percent}% to buy into — roughly {cost}{" "}
      {payToken} of what you pay. Thin market; Jupiter&apos;s estimate.
    </p>
  );
}

/** Which version you get. Set only by the version cards, never a free dropdown. */
function VersionPill({ selected }: { selected: SelectedVersion | null }) {
  if (!selected) {
    return (
      <span className="shrink-0 rounded-full border border-dashed border-white/20 px-3 py-2 text-sm text-white/60">
        Pick a version below
      </span>
    );
  }
  return (
    <span className="flex max-w-[60%] shrink-0 items-center gap-2 rounded-full bg-white/[0.08] py-2 pl-2 pr-3 text-base font-semibold text-white ring-1 ring-white/10">
      <Monogram symbol={selected.symbol} size="sm" />
      <span className="truncate">
        {selected.tokenSymbol}
        {/* On phones the provider is dropped here; the selected card below names it. */}
        <span className="hidden font-normal text-white/60 sm:inline"> · {selected.providerName}</span>
        <span className="sr-only sm:hidden"> from {selected.providerName}</span>
      </span>
    </span>
  );
}

/**
 * The pay token's own mark.
 *
 * Previously a dollar sign and a stacked "S" drawn in type, which is what a
 * swap panel looks like before anyone has put the real marks in. Round mask
 * because the Solana mark is published on a black square and is normally set
 * in a circle; the USDC one is already round and unaffected.
 */
function PayTokenGlyph({ token }: { token: PayTokenSymbol }) {
  return (
    <Image
      src={`/brand/tokens/${token.toLowerCase()}.png`}
      alt=""
      aria-hidden
      width={64}
      height={64}
      className="size-7 shrink-0 rounded-full"
    />
  );
}

