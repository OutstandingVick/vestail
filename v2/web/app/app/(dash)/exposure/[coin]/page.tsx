import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ExposurePanel } from "@/components/ExposurePanel";
import { NotAssessedBadge, VerdictBadge } from "@/components/VerdictBadge";
import { INSTRUMENT_LABEL } from "@/lib/instrument";
import { api, ApiError } from "@/lib/server/api";
import { liveMarkets } from "@/lib/server/hyperliquid";
import { readProfile } from "@/lib/server/profile";

const usd = (n: number, max = 2) => n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: max });
const compact = (n: number) => n.toLocaleString(undefined, { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 });

/** A commodity perpetual: what it is, its live price, its verdict here, and the route. */
export default async function ExposurePage({ params }: { params: Promise<{ coin: string }> }) {
  const { coin } = await params;
  const [profile, countries] = await Promise.all([readProfile(), api.countries()]);
  const id = `xyz:${coin.toUpperCase()}`;
  const market = await api.derivative(id, profile!.country).catch(e => { if (e instanceof ApiError && e.status === 404) notFound(); throw e; });
  const live = (await liveMarkets("xyz").catch(() => null))?.get(id) ?? null;
  const country = countries.find(c => c.code === profile!.country)!;
  const gates = market.issuer?.evidence ?? [];

  return (
    <div className="mt-8 flex flex-col gap-4">
      <p className="text-[13px] font-semibold tracking-[0.08em] text-muted uppercase">
        <Link href="/app/search" className="hover:text-ink">Search</Link> / Price exposure / {market.name}
      </p>
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-4">
          <section className="flex flex-col gap-4 rounded-panel bg-surface p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-[28px] font-bold">{market.name} perpetual</h1>
              {market.status ? <VerdictBadge status={market.status} size="lg" /> : <NotAssessedBadge />}
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-full bg-tint px-2.5 py-1">Hyperliquid</span>
              <span className="rounded-full border-[1.5px] border-cond px-2.5 py-1">{INSTRUMENT_LABEL.commodity_derivative.label}</span>
              <span className="rounded-full bg-wash px-2.5 py-1">Deployed by {market.deployer}</span>
            </div>
            <p className="text-[15px]">
              A perpetual future on the price of {market.name.toLowerCase()}. You never own or receive any {market.name.toLowerCase()}: you hold a
              margined position that gains or loses with the price, pays or earns funding, and is liquidated if your margin runs out.
            </p>
            {market.related_asset && (
              <p className="text-sm text-muted">
                Want to own {market.name.toLowerCase()} itself? That&apos;s a different question:{" "}
                <Link href={`/app/asset/${market.related_asset}`} className="inline-flex items-center gap-1 font-semibold text-emphasis">see the ownership rule in {country.name} <ArrowRight size={16} weight="regular" aria-hidden="true" /></Link>
              </p>
            )}
          </section>

          <section aria-labelledby="live-title" className="flex flex-col gap-3 rounded-panel bg-surface p-7">
            <h2 id="live-title" className="text-lg font-bold">Live market</h2>
            {live ? (
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                <div><dt className="text-xs text-muted">Mark price</dt><dd className="font-display text-2xl font-bold">{usd(live.markPx, 4)}</dd></div>
                <div><dt className="text-xs text-muted">24h change</dt><dd className={`text-lg font-semibold ${live.changePct >= 0 ? "text-can" : "text-cannot"}`}>{live.changePct >= 0 ? "+" : ""}{live.changePct.toFixed(2)}%</dd></div>
                <div><dt className="text-xs text-muted">Oracle price</dt><dd className="text-lg">{usd(live.oraclePx, 4)}</dd></div>
                <div><dt className="text-xs text-muted">Funding (hourly)</dt><dd className="text-lg">{live.fundingHourlyPct.toFixed(4)}%</dd></div>
                <div><dt className="text-xs text-muted">Open interest</dt><dd className="text-lg">{compact(live.openInterestUsd)}</dd></div>
                <div><dt className="text-xs text-muted">24h volume</dt><dd className="text-lg">{compact(live.dayVolumeUsd)}</dd></div>
                <div><dt className="text-xs text-muted">Max leverage</dt><dd className="text-lg">{live.maxLeverage}×{live.isolatedOnly ? " · isolated only" : ""}</dd></div>
              </dl>
            ) : <p className="text-sm text-muted">Hyperliquid&apos;s market data couldn&apos;t be reached just now.</p>}
            <p className="text-xs text-muted">From Hyperliquid&apos;s public info API, refreshed every 15 seconds.</p>
          </section>

          <section className="flex flex-col gap-2 rounded-panel bg-surface p-7">
            <h2 className="text-lg font-bold">Why this verdict in {country.name}</h2>
            {market.assessed ? (
              <ul className="flex flex-col gap-2 text-sm">
                {gates.map(g => (
                  <li key={g.rule}>
                    {g.reason}{" "}
                    <a href={g.source_url} target="_blank" rel="noreferrer" className="text-emphasis underline">source</a>
                    {g.source_quality === "secondary" && <span className="text-muted"> (secondary source)</span>}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm">No rule covers this market in {country.name} yet. Not assessed is not permission.</p>}
          </section>
        </div>
        <div className="min-w-0 flex-[1_1_340px]"><ExposurePanel market={market} /></div>
      </div>
    </div>
  );
}
