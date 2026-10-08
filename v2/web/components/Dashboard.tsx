"use client";

import { useUser } from "@privy-io/react-auth";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ValueChart } from "@/components/ValueChart";
import { NotAssessedBadge, VerdictBadge } from "@/components/VerdictBadge";
import { accountOf } from "@/lib/account";
import { CHAIN_LABEL } from "@/lib/instrument";
import { authedFetch, errorOf } from "@/lib/client";
import type { Asset, Portfolio, Status } from "@/lib/types";

const usd = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const short = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`;
const when = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });

function Card({ title, aside, children, className = "" }: { title: string; aside?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`flex min-w-0 flex-col gap-4 rounded-panel bg-surface p-6 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-bold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="rounded-field bg-wash px-4 py-6 text-center text-sm text-muted">{children}</p>;
}

/**
 * The returning user's home: what they hold, what each holding is allowed to
 * be where they live, what they bought, and what they're watching. Every
 * number comes from /api/portfolio; while it loads, nothing is invented.
 */
export function Dashboard({ assets, countryName, who }: { assets: Asset[]; countryName: string; who: string }) {
  const { user } = useUser();
  const account = accountOf(user);
  const [data, setData] = useState<Portfolio | null>(null);
  const [error, setError] = useState<string | null>(null);
  const nameOf = new Map(assets.map(a => [a.id, a.name]));

  useEffect(() => {
    authedFetch("/api/portfolio")
      .then(async res => (res.ok ? setData(await res.json()) : setError(await errorOf(res, "Couldn't load your portfolio."))))
      .catch(() => setError("Couldn't reach Vestail. Check your connection and reload."));
  }, []);

  // The portfolio always renders: while loading it shows placeholders, and if
  // loading fails it shows the same layout, empty, with the reason on top.
  if (!data) {
    return (
      <>
        <header className="pt-4">
          <h1 className="text-[32px] font-extrabold tracking-[-0.02em]">Portfolio</h1>
          <p className="text-muted">What you hold, and what it&apos;s allowed to be in {countryName}, as a {who}.</p>
        </header>
        {error && <p role="alert" className="rounded-field bg-cond-wash px-4 py-3 text-sm text-cond-ink">{error}</p>}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3" aria-busy={!error}>
          {["Total value", "Cash", "Your holdings, judged"].map(t => (
            <Card key={t} title={t}>
              <div className={`h-10 w-2/3 rounded-xl bg-wash ${error ? "" : "animate-pulse"}`} />
            </Card>
          ))}
        </div>
        {!error && <span role="status" className="sr-only">Reading your wallets…</span>}
      </>
    );
  }

  const byStatus = (s: Status | null) => data.holdings.filter(h => h.status === s).length;
  const flagged = data.holdings.filter(h => h.status === "cannot_own");

  return (
    <>
      <header className="pt-4">
        <h1 className="text-[32px] font-extrabold tracking-[-0.02em]">Portfolio</h1>
        <p className="text-muted">What you hold, and what it&apos;s allowed to be in {countryName}, as a {who}.</p>
      </header>

      {data.errors.map(e => <p key={e} role="alert" className="rounded-field bg-cond-wash px-4 py-3 text-sm text-cond-ink">{e}</p>)}
      {flagged.length > 0 && (
        <p role="alert" className="rounded-field border-l-0 bg-surface px-4 py-3 text-sm ring-2 ring-cannot">
          <strong>You hold {flagged.length === 1 ? "a version" : `${flagged.length} versions`} that can&apos;t be owned in {countryName}:</strong>{" "}
          {flagged.map(h => h.token_symbol).join(", ")}. Vestail won&apos;t route more, and you may want to check your position.
        </p>
      )}

      <section aria-labelledby="balance-title" className="flex flex-wrap items-end justify-between gap-6 rounded-panel bg-surface p-7 shadow-[0_18px_50px_rgba(124,92,255,0.10)]">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted">Hi, {account.label}</p>
          <h2 id="balance-title" className="text-sm font-semibold">Total balance</h2>
          <p className="font-display text-[clamp(44px,6vw,72px)] leading-none font-extrabold tracking-[-0.03em]">{usd(data.totals.usd)}</p>
          <p className="text-sm text-muted">
            {data.wallets.length ? `Across ${data.wallets.length === 1 ? "your wallet" : `${data.wallets.length} wallets`}: ${data.wallets.map(short).join(", ")}` : "No Solana wallet is linked yet."}
          </p>
          {data.totals.unpriced > 0 && <p className="text-xs text-muted">{data.totals.unpriced} holding{data.totals.unpriced > 1 ? "s" : ""} couldn&apos;t be priced and {data.totals.unpriced > 1 ? "are" : "is"} left out.</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/app/settings#wallet" className="flex min-h-12 items-center gap-2 rounded-full bg-ink px-5 font-semibold text-page">
            <span aria-hidden="true">+</span> Deposit
          </Link>
          <Link href="/app/search" className="flex min-h-12 items-center gap-2 rounded-full bg-action px-5 font-semibold text-on-action">Buy</Link>
          <Link href="/app/compare" className="flex min-h-12 items-center rounded-full border-[1.5px] border-field px-5 font-semibold">Compare</Link>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Cash" aside={<span className="text-xs text-muted">Ready to buy with</span>}>
          <p className="font-display text-3xl font-bold">{usd(data.totals.cash_usd)}</p>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted">USDC</dt><dd className="text-right">{data.cash.usdc.toLocaleString(undefined, { maximumFractionDigits: 2 })}</dd>
            <dt className="text-muted">SOL</dt><dd className="text-right">{data.cash.sol.toLocaleString(undefined, { maximumFractionDigits: 4 })}{data.cash.sol_usd !== null && <span className="text-muted"> · {usd(data.cash.sol_usd)}</span>}</dd>
            <dt className="text-muted">ETH on Base</dt><dd className="text-right">{data.cash.eth.base.toLocaleString(undefined, { maximumFractionDigits: 5 })}</dd>
            <dt className="text-muted">ETH on Robinhood</dt><dd className="text-right">{data.cash.eth.robinhood.toLocaleString(undefined, { maximumFractionDigits: 5 })}</dd>
          </dl>
        </Card>
        <Card title="Tokenised stocks" aside={<span className="text-xs text-muted">Live prices</span>}>
          <p className="font-display text-3xl font-bold">{usd(data.totals.holdings_usd)}</p>
          <p className="text-sm text-muted">{data.holdings.length ? `${data.holdings.length} version${data.holdings.length > 1 ? "s" : ""} held` : "None held yet"}</p>
        </Card>
        <Card title="Your holdings, judged" aside={<span className="text-xs text-muted">In {countryName}</span>}>
          <ul className="flex flex-wrap gap-2 text-sm">
            {(["can_own", "conditional", "cannot_own"] as const).map(s => (
              <li key={s} className="flex items-center gap-1.5"><VerdictBadge status={s} /> <span className="font-semibold">{byStatus(s)}</span></li>
            ))}
            {byStatus(null) > 0 && <li className="flex items-center gap-1.5"><NotAssessedBadge /> <span className="font-semibold">{byStatus(null)}</span></li>}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Value over time" className="lg:col-span-2" aside={<span className="text-xs text-muted">USD, one point per day</span>}>
          <ValueChart points={data.history} />
        </Card>
        <Card title="Recent buys">
          {data.orders.length ? (
            <ol className="flex flex-col gap-3">
              {data.orders.slice(0, 6).map(o => (
                <li key={o.id} className="flex items-start gap-3 text-sm">
                  <span aria-hidden="true" className={`mt-1.5 size-2.5 shrink-0 rounded-full ring-2 ${o.acknowledged ? "ring-cond" : "ring-can"}`} />
                  <span className="flex flex-col">
                    <span><strong>{nameOf.get(o.asset) ?? o.asset}</strong> via {o.venue}</span>
                    <span className="text-xs text-muted">{when(o.at)} · {o.country}{o.acknowledged ? " · condition acknowledged" : ""}</span>
                  </span>
                </li>
              ))}
            </ol>
          ) : <Empty>No buys yet. When you buy through Vestail it shows up here.</Empty>}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card title="Holdings" className="lg:col-span-2" aside={<span className="text-xs text-muted">Solana, Base and Robinhood Chain</span>}>
          {data.holdings.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="text-xs text-muted">
                  <tr><th className="py-2 font-medium">Version</th><th className="py-2 font-medium">Chain</th><th className="py-2 font-medium">Amount</th><th className="py-2 font-medium">Value</th><th className="py-2 text-right font-medium">Verdict here</th></tr>
                </thead>
                <tbody>
                  {data.holdings.map(h => (
                    <tr key={h.mint} className="border-t border-line">
                      <td className="py-3">
                        <Link href={`/app/asset/${h.asset}?symbol=${h.symbol}`} className="font-semibold hover:text-emphasis">{h.token_symbol}</Link>
                        <div className="text-xs text-muted">{h.name} · {h.provider}</div>
                      </td>
                      <td className="py-3">{CHAIN_LABEL[h.chain] ?? h.chain}</td>
                      <td className="py-3">{h.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                      <td className="py-3">{h.usd === null ? <span className="text-muted">unpriced</span> : usd(h.usd)}</td>
                      <td className="py-3 text-right">{h.status ? <VerdictBadge status={h.status} /> : <NotAssessedBadge />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <Empty>You don&apos;t hold any tokenised stocks Vestail tracks yet. <Link href="/app/search?q=NVIDIA" className="text-emphasis underline">See what you can buy</Link>.</Empty>}
        </Card>
        <Card title="Watchlist">
          {data.watchlist.length ? (
            <ul className="flex flex-col gap-2">
              {data.watchlist.map(w => (
                <li key={w.asset + (w.symbol ?? "")}>
                  <Link href={`/app/asset/${w.asset}${w.symbol ? `?symbol=${w.symbol}` : ""}`} className="flex min-h-11 items-center justify-between gap-2 rounded-xl bg-wash px-3 hover:bg-tint">
                    <span className="text-sm font-semibold">{w.symbol ? `${w.symbol} · ` : ""}{w.name}</span>
                    <VerdictBadge status={w.status} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : <Empty>Nothing watched yet. Use “Watch” on any asset page.</Empty>}
        </Card>
      </div>
      <Card title="Price exposure on Hyperliquid" aside={<span className="text-xs text-muted">Positions, not holdings: you own no commodity</span>}>
        {data.positions.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-xs text-muted">
                <tr><th className="py-2 font-medium">Market</th><th className="py-2 font-medium">Size</th><th className="py-2 font-medium">Notional</th><th className="py-2 font-medium">Unrealised P&amp;L</th><th className="py-2 text-right font-medium">Verdict here</th></tr>
              </thead>
              <tbody>
                {data.positions.map(p => (
                  <tr key={p.market} className="border-t border-line">
                    <td className="py-3"><Link href={`/app/exposure/${p.coin.toLowerCase()}`} className="font-semibold hover:text-emphasis">{p.name}</Link><div className="text-xs text-muted">{p.market} · {p.size > 0 ? "long" : "short"}</div></td>
                    <td className="py-3">{Math.abs(p.size).toLocaleString(undefined, { maximumFractionDigits: 4 })}</td>
                    <td className="py-3">{usd(p.valueUsd)}</td>
                    <td className={`py-3 font-semibold ${p.pnlUsd >= 0 ? "text-can" : "text-cannot"}`}>{p.pnlUsd >= 0 ? "+" : ""}{usd(p.pnlUsd)}</td>
                    <td className="py-3 text-right">{p.status ? <VerdictBadge status={p.status} /> : <NotAssessedBadge />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <Empty>No open positions. Gold, crude oil and copper exposure is under <Link href="/app/search?q=crude%20oil" className="text-emphasis underline">Search</Link>.</Empty>}
      </Card>
    </>
  );
}
