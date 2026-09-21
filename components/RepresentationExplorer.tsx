"use client";

import { useEffect, useMemo, useState } from "react";

import {
  PRIVATE_SYMBOLS,
  REGION_ALLOWLIST,
  SYMBOL_ALLOWLIST,
  type AllowedRegion,
  type AllowedSymbol,
} from "@/lib/constants";
import { evaluate } from "@/lib/evaluate";
import {
  formatAge,
  formatCompactUsd,
  formatSignedPct,
  formatUsd,
  truncateAddress,
} from "@/lib/format";
import { PROVIDER_NAME, STRUCTURE_COPY } from "@/lib/labels";
import { POLICIES } from "@/lib/policies";
import {
  SymbolViewSchema,
  type RepresentationQuote,
  type SymbolView,
  type Verdict,
} from "@/lib/types";

import { RegionPicker, VerdictStrip, VerdictSummary } from "@/components/Verdicts";

const REGION_STORAGE_KEY = "vestail.region";

/**
 * The declared region is remembered per browser as a convenience only. Reads
 * and writes are guarded: storage can be blocked, and the page must work the
 * same without it.
 */
function readStoredRegion(): AllowedRegion | null {
  try {
    const value = window.localStorage.getItem(REGION_STORAGE_KEY);
    return (REGION_ALLOWLIST as readonly string[]).includes(value ?? "")
      ? (value as AllowedRegion)
      : null;
  } catch {
    return null;
  }
}

function storeRegion(region: AllowedRegion) {
  try {
    window.localStorage.setItem(REGION_STORAGE_KEY, region);
  } catch {
    // Not remembered next visit; nothing else depends on it.
  }
}

/** Below this, a pool is too thin to buy into at any meaningful size. */
const THIN_LIQUIDITY_USD = 1_000;

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; view: SymbolView };

/**
 * Pick a symbol, see every tokenized version of it side by side.
 *
 * Each token shows what it *is* and what it trades at; once a jurisdiction is
 * declared, it also shows what the issuer's terms say about holding it there.
 * Verdicts are computed in the browser from the bundled policy files, so
 * switching region is instant and needs no request.
 */
export function RepresentationExplorer() {
  const [symbol, setSymbol] = useState<AllowedSymbol>("SPCX");
  const [region, setRegion] = useState<AllowedRegion | null>(null);
  const [state, setState] = useState<LoadState>({ status: "loading" });

  // Read after mount, not during render, so server and client HTML match.
  useEffect(() => {
    setRegion(readStoredRegion());
  }, []);

  const declareRegion = (r: AllowedRegion) => {
    setRegion(r);
    storeRegion(r);
  };

  useEffect(() => {
    const controller = new AbortController();
    setState({ status: "loading" });

    fetch(`/api/representations/${symbol}`, { signal: controller.signal })
      .then(async (res) => {
        const body: unknown = await res.json();
        if (!res.ok) {
          const message =
            typeof body === "object" && body && "error" in body
              ? String(body.error)
              : `Request failed (${res.status}).`;
          throw new Error(message);
        }
        // Validate the response rather than trusting its shape.
        setState({ status: "ready", view: SymbolViewSchema.parse(body) });
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          status: "error",
          message:
            cause instanceof Error ? cause.message : "Could not load data.",
        });
      });

    return () => controller.abort();
  }, [symbol]);

  return (
    <section aria-labelledby="explorer-heading">
      <h2
        id="explorer-heading"
        className="text-xs uppercase tracking-[0.18em] text-dim"
      >
        One ticker, every token
      </h2>

      <div className="mt-4">
        <p className="mb-2 text-sm text-paper">Where are you?</p>
        <RegionPicker region={region} onChange={declareRegion} />
      </div>

      <p className="mt-6 mb-2 text-sm text-paper">Which stock?</p>
      <div
        role="group"
        aria-label="Symbol"
        className="flex flex-wrap gap-2"
      >
        {SYMBOL_ALLOWLIST.map((s) => (
          <button
            key={s}
            type="button"
            aria-pressed={s === symbol}
            onClick={() => setSymbol(s)}
            className={`rounded-md border px-3 py-1.5 font-mono text-sm transition-colors ${
              s === symbol
                ? "border-gold bg-surface text-paper"
                : "border-line text-dim hover:border-dim hover:text-paper"
            }`}
          >
            {s}
            {PRIVATE_SYMBOLS.has(s) && (
              <span className="ml-1.5 font-sans text-[10px] uppercase tracking-wider text-dim">
                private
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {state.status === "loading" && (
          <p className="text-sm text-dim" role="status">
            Resolving {symbol}…
          </p>
        )}
        {state.status === "error" && (
          <p className="text-sm text-paper" role="alert">
            Could not load {symbol}: {state.message}
          </p>
        )}
        {state.status === "ready" && (
          <SymbolTable view={state.view} region={region} />
        )}
      </div>
    </section>
  );
}

function SymbolTable({
  view,
  region,
}: {
  view: SymbolView;
  region: AllowedRegion | null;
}) {
  const count = view.representations.length;

  const verdicts = useMemo(
    () =>
      region === null
        ? null
        : view.representations.map((q) =>
            evaluate(
              q.representation,
              region,
              POLICIES[q.representation.provider],
            ),
          ),
    [view, region],
  );

  return (
    <div>
      <p className="font-display text-2xl leading-snug text-paper">
        {count} {count === 1 ? "token" : "tokens"} say “{view.symbol}”.{" "}
        <span className="text-dim">
          {new Set(view.representations.map((q) => q.representation.structure))
            .size}{" "}
          different legal claims.
        </span>
      </p>

      <p className="mt-2 text-sm text-dim">
        {view.reference ? (
          <>
            Listed share: {formatUsd(view.reference.price)} · Pyth ·{" "}
            {formatAge(view.reference.publishTime)}
          </>
        ) : view.isPrivate ? (
          "Private company: no listed share, so the only reference is each issuer's own mark."
        ) : (
          "Listed-share reference price unavailable."
        )}
      </p>

      <div className="mt-3">
        {region && verdicts ? (
          <VerdictSummary verdicts={verdicts} region={region} />
        ) : (
          <p className="text-sm text-dim">
            Declare where you are to see which of these you may actually hold.
          </p>
        )}
      </div>

      {view.warnings.length > 0 && (
        <ul className="mt-4 space-y-1 border-l-2 border-gold pl-4 text-xs leading-relaxed text-dim">
          {view.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}

      <div className="mt-6 overflow-hidden rounded-lg border border-line">
        {/* Column headings: desktop only; rows stack into cards on mobile. */}
        <div className="hidden grid-cols-[1.1fr_2fr_1fr_1fr_0.8fr] gap-4 border-b border-line bg-surface px-5 py-3 text-[11px] uppercase tracking-[0.14em] text-dim md:grid">
          <span>Token</span>
          <span>What you actually hold</span>
          <span className="text-right">Price</span>
          <span className="text-right">Versus</span>
          <span className="text-right">Liquidity</span>
        </div>

        <ul>
          {view.representations.map((q, i) => (
            <Row
              key={q.representation.mint}
              quote={q}
              symbol={view.symbol}
              region={region}
              verdict={verdicts ? verdicts[i] : undefined}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

function Row({
  quote,
  symbol,
  region,
  verdict,
}: {
  quote: RepresentationQuote;
  symbol: string;
  region: AllowedRegion | null;
  /** undefined: no region declared. null: declared, but not assessed. */
  verdict: Verdict | null | undefined;
}) {
  const r = quote.representation;
  const copy = STRUCTURE_COPY[r.structure];
  const thin =
    quote.liquidityUsd !== null && quote.liquidityUsd < THIN_LIQUIDITY_USD;

  return (
    <li className="border-b border-line px-5 py-4 last:border-b-0">
      <div className="grid gap-3 md:grid-cols-[1.1fr_2fr_1fr_1fr_0.8fr] md:gap-4">
      <div>
        <p className="text-sm text-paper">
          {PROVIDER_NAME[r.provider]}{" "}
          <span className="font-mono text-dim">{r.tokenSymbol}</span>
        </p>
        <a
          href={`https://solscan.io/token/${r.mint}`}
          target="_blank"
          rel="noreferrer"
          title={r.mint}
          className="font-mono text-xs text-dim underline-offset-4 hover:text-paper hover:underline"
        >
          {truncateAddress(r.mint)}
        </a>
      </div>

      <div>
        <p className="text-sm text-paper">{copy.label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-dim">{copy.holds}</p>
        <a
          href={r.source}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-block text-xs text-dim underline underline-offset-4 hover:text-paper"
        >
          Source
        </a>
      </div>

      <div className="flex items-baseline justify-between gap-2 md:block md:text-right">
        <span className="text-xs uppercase tracking-wider text-dim md:hidden">
          Price
        </span>
        <div>
          <p className="text-sm text-paper tabular-nums">
            {quote.price !== null ? formatUsd(quote.price) : "—"}
          </p>
          {quote.priceSource && (
            <p className="text-[11px] text-dim">
              {quote.priceSource === "pyth" ? "Pyth" : "Jupiter"}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2 md:block md:text-right">
        <span className="text-xs uppercase tracking-wider text-dim md:hidden">
          Versus
        </span>
        <Comparison quote={quote} symbol={symbol} />
      </div>

      <div className="flex items-baseline justify-between gap-2 md:block md:text-right">
        <span className="text-xs uppercase tracking-wider text-dim md:hidden">
          Liquidity
        </span>
        <div>
          <p className="text-sm text-paper tabular-nums">
            {quote.liquidityUsd !== null
              ? formatCompactUsd(quote.liquidityUsd)
              : "—"}
          </p>
          {thin && <p className="text-[11px] text-gold">Too thin to trade</p>}
        </div>
      </div>
      </div>

      {region && verdict !== undefined && (
        <div className="mt-4">
          <VerdictStrip
            verdict={verdict}
            region={region}
            canFreeze={r.freezeAuthority !== null}
          />
        </div>
      )}
    </li>
  );
}

/**
 * Premium or discount, always against a named reference. A bare "+12%" would
 * invite the reader to assume a baseline; this says which one it is.
 */
function Comparison({
  quote,
  symbol,
}: {
  quote: RepresentationQuote;
  symbol: string;
}) {
  if (quote.vsReferencePct !== null) {
    return (
      <div>
        <p className="text-sm text-paper tabular-nums">
          {formatSignedPct(quote.vsReferencePct)}
        </p>
        <p className="text-[11px] text-dim">vs listed {symbol}</p>
      </div>
    );
  }
  if (quote.vsIssuerMarkPct !== null && quote.issuerMark !== null) {
    return (
      <div>
        <p className="text-sm text-paper tabular-nums">
          {formatSignedPct(quote.vsIssuerMarkPct)}
        </p>
        <p className="text-[11px] text-dim">
          vs issuer mark {formatUsd(quote.issuerMark)}
        </p>
      </div>
    );
  }
  return <p className="text-sm text-dim">—</p>;
}
