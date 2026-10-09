import Link from "next/link";

import { NotAssessedBadge, VerdictBadge } from "@/components/VerdictBadge";
import { CHAIN_LABEL, INSTRUMENT_LABEL } from "@/lib/instrument";
import { api } from "@/lib/server/api";
import { readProfile } from "@/lib/server/profile";
import type { Chain, Instrument, Status } from "@/lib/types";

const CHAINS: Chain[] = ["solana", "base", "robinhood", "hyperliquid"];
const INSTRUMENTS: Instrument[] = ["tokenized_equity", "tokenized_debt", "broker_entitlement", "contractual_exposure", "commodity_derivative"];
type MarketRow = { id: string; name: string; symbol: string; chain: Chain; instrument: Instrument; provider: string; status: Status | null; assessed: boolean; href: string; exposure: boolean };

export default async function MarketsPage({ searchParams }: { searchParams: Promise<{ chain?: string; instrument?: string; show?: string }> }) {
  const profile = (await readProfile())!;
  const params = await searchParams;
  const chain = CHAINS.includes(params.chain as Chain) ? params.chain as Chain : undefined;
  const instrument = INSTRUMENTS.includes(params.instrument as Instrument) ? params.instrument as Instrument : undefined;
  const show = params.show === "all" ? "all" : "buyable";
  const [symbols, markets] = await Promise.all([api.tokenSymbols(), api.derivatives()]);
  const [boards, judgedMarkets] = await Promise.all([
    Promise.all(symbols.map(symbol => api.tokens(symbol.symbol, profile.country, profile.who).catch(() => null))),
    Promise.all(markets.map(market => api.derivative(market.id, profile.country).catch(() => null))),
  ]);

  const rows: MarketRow[] = [
    ...boards.flatMap(board => board ? board.tokens.map(token => ({
      id: `${token.chain}:${token.address}`, name: token.name, symbol: token.token_symbol, chain: token.chain,
      instrument: token.instrument, provider: token.provider, status: token.status, assessed: token.assessed,
      href: `/app/asset/${board.asset}?symbol=${board.symbol}`, exposure: false,
    })) : []),
    ...judgedMarkets.flatMap(market => market ? [{
      id: market.id, name: market.name, symbol: market.coin, chain: market.chain,
      instrument: market.instrument, provider: market.venue, status: market.status ?? null,
      assessed: market.assessed ?? false, href: `/app/exposure/${market.coin.toLowerCase()}`, exposure: true,
    }] : []),
  ].sort((a, b) => statusScore(b.status) - statusScore(a.status) || a.name.localeCompare(b.name));

  const isBuyable = (row: MarketRow) => row.status === "can_own" || row.status === "conditional";
  const visible = rows.filter(row => (!chain || row.chain === chain) && (!instrument || row.instrument === instrument) && (show === "all" || isBuyable(row)));
  const href = (next: { chain?: string | null; instrument?: string | null; show?: string }) => {
    const query = new URLSearchParams();
    const nextChain = next.chain === undefined ? chain : next.chain;
    const nextInstrument = next.instrument === undefined ? instrument : next.instrument;
    const nextShow = next.show ?? show;
    if (nextChain) query.set("chain", nextChain);
    if (nextInstrument) query.set("instrument", nextInstrument);
    if (nextShow === "all") query.set("show", "all");
    const value = query.toString();
    return `/app/markets${value ? `?${value}` : ""}`;
  };
  const count = (test: (row: MarketRow) => boolean) => rows.filter(test).length;

  return (
    <div className="flex flex-col gap-7 pt-4">
      <header><p className="mb-2 text-xs font-bold uppercase tracking-[0.13em] text-action-ink">Available through Vestail</p><h1 className="text-[clamp(36px,5vw,64px)] font-extrabold leading-[1.02] tracking-[-0.05em]">Markets</h1><p className="mt-3 max-w-3xl leading-7 text-muted">Everything you can buy or trade through Vestail, judged for your declared country and buyer type.</p></header>
      <p className="rounded-card bg-tint px-5 py-4 text-sm leading-6 text-muted"><strong className="text-ink">Commodity markets are price exposure, not ownership.</strong> Hyperliquid rows are perpetual futures; you never own the underlying gold, oil, or copper.</p>

      <section aria-label="Market filters" className="flex flex-col gap-5 rounded-panel bg-surface p-5 sm:p-6">
        <Filter label="Chain">
          <Pill href={href({ chain: null })} active={!chain}>All <Count>{rows.length}</Count></Pill>
          {CHAINS.map(value => <Pill key={value} href={href({ chain: value })} active={chain === value}>{CHAIN_LABEL[value]} <Count>{count(row => row.chain === value)}</Count></Pill>)}
        </Filter>
        <Filter label="Instrument">
          <Pill href={href({ instrument: null })} active={!instrument}>All <Count>{rows.length}</Count></Pill>
          {INSTRUMENTS.map(value => <Pill key={value} href={href({ instrument: value })} active={instrument === value}>{INSTRUMENT_LABEL[value].label} <Count>{count(row => row.instrument === value)}</Count></Pill>)}
        </Filter>
        <Filter label="Show">
          <Pill href={href({ show: "buyable" })} active={show === "buyable"}>Buyable <Count>{count(isBuyable)}</Count></Pill>
          <Pill href={href({ show: "all" })} active={show === "all"}>All assessed states <Count>{rows.length}</Count></Pill>
        </Filter>
      </section>

      <section aria-labelledby="market-results-title" className="flex flex-col gap-3">
        <div><h2 id="market-results-title" className="text-xl font-bold">Available markets</h2><p className="mt-1 text-sm text-muted">{visible.length} {visible.length === 1 ? "market" : "markets"} in this view</p></div>
        {visible.length ? <div className="overflow-x-auto rounded-panel bg-surface"><table className="w-full min-w-[820px] text-left text-sm">
          <thead className="text-xs text-muted"><tr><th className="px-5 py-4 font-medium">Market</th><th className="px-3 py-4 font-medium">Chain</th><th className="px-3 py-4 font-medium">Instrument</th><th className="px-3 py-4 font-medium">Issuer / venue</th><th className="px-5 py-4 text-right font-medium">Verdict</th></tr></thead>
          <tbody>{visible.map(row => <tr key={row.id} className="border-t border-line"><td className="px-5 py-4"><Link href={row.href} className="block min-h-11 font-semibold hover:text-emphasis"><span>{row.name}</span><span className="mt-0.5 block text-xs font-normal text-muted">{row.symbol}{row.exposure ? " · price exposure only" : ""}</span></Link></td><td className="px-3 py-4"><span className="rounded-full bg-tint px-2.5 py-1 text-xs font-semibold">{CHAIN_LABEL[row.chain]}</span></td><td className="px-3 py-4"><span className="font-semibold">{INSTRUMENT_LABEL[row.instrument].label}</span><span className="mt-0.5 block max-w-[260px] text-xs leading-5 text-muted">{INSTRUMENT_LABEL[row.instrument].explain}</span></td><td className="px-3 py-4">{row.provider}</td><td className="px-5 py-4 text-right">{row.status ? <VerdictBadge status={row.status} /> : <NotAssessedBadge />}</td></tr>)}</tbody>
        </table></div> : <div className="rounded-panel bg-surface px-6 py-14 text-center"><h3 className="text-lg font-bold">No markets match these filters</h3><p className="mt-2 text-sm text-muted">Try another chain, instrument, or show all assessment states.</p><Link href="/app/markets?show=all" className="mt-5 inline-flex min-h-11 items-center rounded-full bg-action px-5 font-bold text-on-action">Show all markets</Link></div>}
      </section>
    </div>
  );
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) { return <div><h2 className="mb-2.5 text-xs font-semibold text-muted">{label}</h2><div className="flex flex-wrap gap-2">{children}</div></div>; }
function Pill({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) { return <Link href={href} aria-current={active ? "page" : undefined} className={`flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-semibold ${active ? "border-ink-strong bg-ink-strong text-page" : "border-line bg-page hover:bg-tint"}`}>{children}</Link>; }
function Count({ children }: { children: React.ReactNode }) { return <span className="text-xs opacity-70">{children}</span>; }
function statusScore(status: Status | null) { return status === "can_own" ? 3 : status === "conditional" ? 2 : status === "cannot_own" ? 1 : 0; }
