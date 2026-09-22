"use client";

import { fromBaseUnits, sanitizeAmount } from "@/lib/amounts";
import { PAY_TOKENS, type AllowedSymbol, type PayTokenSymbol } from "@/lib/constants";
import { formatUsdc } from "@/lib/format";
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
            <svg aria-hidden viewBox="0 0 20 20" className="size-4 text-white/60">
              <path d="M6 8 10 4 14 8M6 12 10 16 14 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
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
            <svg aria-hidden viewBox="0 0 20 20" className="size-5">
              <path d="M7 4v12M7 16l-3-3M7 16l3-3M13 16V4M13 4l-3 3M13 4l3 3" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
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
        <p className="text-sm font-semibold text-white/80">You get</p>
        <div className="mt-3 flex items-center gap-3">
          <div className="min-w-0 flex-1" aria-live="polite">
            <EstimateAmount estimate={estimate} selected={selected} />
          </div>
          <VersionPill selected={selected} />
        </div>
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
      <span className="block truncate text-4xl font-semibold text-white">
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
  return <span className="block text-4xl font-semibold text-white/30">0.0</span>;
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
        {selected.tokenSymbol} <span className="font-normal text-white/60">· {selected.providerName}</span>
      </span>
    </span>
  );
}

/** Plain glyphs for the pay tokens: a dollar for USDC, a stacked S for SOL. */
function PayTokenGlyph({ token }: { token: PayTokenSymbol }) {
  return (
    <span
      aria-hidden
      className={`inline-flex size-7 items-center justify-center rounded-full text-sm font-bold ${
        token === "USDC" ? "bg-[#2775ca] text-white" : "bg-black text-[#14f195]"
      }`}
    >
      {token === "USDC" ? "$" : "≡"}
    </span>
  );
}

