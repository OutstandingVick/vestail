import Link from "next/link";

import { NotAssessedBadge, VerdictBadge } from "@/components/VerdictBadge";
import { discover } from "@/lib/discover";
import { CHAIN_LABEL, INSTRUMENT_LABEL } from "@/lib/instrument";
import { api } from "@/lib/server/api";
import { readProfile } from "@/lib/server/profile";
import type { Token } from "@/lib/types";

/**
 * Discover: what this buyer can own that they may not know about. Built only
 * from verdicts Vestail already holds, compared across its 12 countries; the
 * class rules are unsourced, and the page says so.
 */
export default async function DiscoverPage() {
  const profile = (await readProfile())!;
  const [countries, assets, matrix, symbols, markets] = await Promise.all([
    api.countries(), api.assets(), api.matrix({ who: profile.who, sort: "asset" }), api.tokenSymbols(), api.derivatives(),
  ]);
  const country = countries.find(c => c.code === profile.country)!;
  const nameOf = new Map(assets.map(a => [a.id, a.name]));
  const d = discover(matrix.rows, profile.country);
  const total = matrix.rows.length;

  // Onchain versions this buyer can actually buy today, and commodity exposure open to them.
  const boards = await Promise.all(symbols.map(s => api.tokens(s.symbol, profile.country, profile.who).catch(() => null)));
  const buyable = boards.flatMap(b => (b ? b.tokens.filter(t => t.status === "can_own" || t.status === "conditional").map(t => ({ b, t })) : []));
  const bySymbol = new Map<string, { name: string; asset: string; symbol: string; tokens: Token[] }>();
  for (const { b, t } of buyable) {
    const e = bySymbol.get(b.symbol) ?? { name: b.name, asset: b.asset, symbol: b.symbol, tokens: [] };
    e.tokens.push(t);
    bySymbol.set(b.symbol, e);
  }
  const judged = await Promise.all(markets.map(m => api.derivative(m.id, profile.country).catch(() => null)));
  const exposure = judged.filter(m => m && (m.status === "can_own" || m.status === "conditional"));

  const section = (title: string, sub: string, body: React.ReactNode) => (
    <section className="flex flex-col gap-3 rounded-panel bg-surface p-6 sm:p-7">
      <div>
        <h2 className="text-xl font-bold">{title}</h2>
        <p className="text-sm text-muted">{sub}</p>
      </div>
      {body}
    </section>
  );
  const empty = (t: string) => <p className="rounded-field bg-wash px-4 py-5 text-center text-sm text-muted">{t}</p>;

  return (
    <div className="flex flex-col gap-6 pt-4">
      <header>
        <h1 className="text-[32px] font-extrabold tracking-[-0.02em]">Discover</h1>
        <p className="text-muted">
          What you can own as a {profile.who} of {country.flag} {country.name}, including things you might not have known about.
        </p>
        <p className="mt-2 text-xs text-muted">
          Asset-class rules aren&apos;t sourced yet: treat them as a guide and check before you act. Onchain versions are judged by
          their issuers&apos; published terms.
        </p>
      </header>

      {section("You can own these, many countries can't", `Can own in ${country.name}, while other countries Vestail covers say no or add conditions. Rarest first.`,
        d.rare.length ? (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {d.rare.map(r => (
              <li key={r.asset}>
                <Link href={`/app/asset/${r.asset}`} className="flex items-center justify-between gap-3 rounded-card bg-wash px-4 py-3.5 hover:ring-2 hover:ring-field">
                  <span className="flex flex-col"><strong>{nameOf.get(r.asset)}</strong><span className="text-xs text-muted">Open to {who(profile.who)} in only {r.openIn} of {total} countries</span></span>
                  <VerdictBadge status="can_own" />
                </Link>
              </li>
            ))}
          </ul>
        ) : empty("Everything you can own here, every covered country allows too."))}

      {section("Buy onchain today", "Tokenized versions you can buy in Vestail from where you are, across Solana, Base and Robinhood Chain.",
        bySymbol.size ? (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[...bySymbol.values()].map(s => (
              <li key={s.symbol}>
                <Link href={`/app/asset/${s.asset}?symbol=${s.symbol}`} className="flex flex-col gap-2 rounded-card bg-wash px-4 py-3.5 hover:ring-2 hover:ring-field">
                  <span className="flex items-center justify-between gap-2"><strong>{s.name} <span className="font-normal text-muted">{s.symbol}</span></strong>
                    <span className="text-xs text-muted">{s.tokens.length} version{s.tokens.length > 1 ? "s" : ""}</span></span>
                  <span className="flex flex-wrap gap-1.5">
                    {s.tokens.map(t => (
                      <span key={t.address} className="rounded-full bg-surface px-2 py-0.5 text-xs">{t.token_symbol} · {CHAIN_LABEL[t.chain]} · {INSTRUMENT_LABEL[t.instrument].label}</span>
                    ))}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : empty(`No onchain version has been assessed as buyable from ${country.name} yet.`))}

      {section("Within reach", "Conditional where you are: you can own these once you clear a licence, cap, approval or KYC step.",
        d.withinReach.length ? (
          <ul className="flex flex-wrap gap-2">
            {d.withinReach.map(w => (
              <li key={w.asset}>
                <Link href={`/app/asset/${w.asset}`} className="flex min-h-10 items-center gap-2 rounded-full bg-cond-wash px-4 text-sm font-semibold text-cond-ink hover:ring-2 hover:ring-cond">
                  {nameOf.get(w.asset)}
                </Link>
              </li>
            ))}
          </ul>
        ) : empty("Nothing is conditional for you here."))}

      {section("Price exposure", "Not ownership: gold, crude oil and copper perpetuals on Hyperliquid that track the price.",
        exposure.length ? (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {exposure.map(m => (
              <li key={m!.id}>
                <Link href={`/app/exposure/${m!.coin.toLowerCase()}`} className="flex items-center justify-between gap-2 rounded-card bg-wash px-4 py-3.5 hover:ring-2 hover:ring-field">
                  <strong>{m!.name}</strong>
                  {m!.status ? <VerdictBadge status={m!.status} /> : <NotAssessedBadge />}
                </Link>
              </li>
            ))}
          </ul>
        ) : empty(`No commodity exposure has been assessed as open to you in ${country.name}.`))}

      {section("Can't own it here? You could elsewhere", `Not open to ${who(profile.who)} in ${country.name}, but open in other countries Vestail covers.`,
        d.elsewhere.length ? (
          <ul className="flex flex-col gap-2">
            {d.elsewhere.map(e => (
              <li key={e.asset}>
                <Link href={`/app/compare?asset=${e.asset}&who=${profile.who}`} className="flex flex-wrap items-center justify-between gap-2 rounded-card bg-wash px-4 py-3 hover:ring-2 hover:ring-field">
                  <strong>{nameOf.get(e.asset)}</strong>
                  <span className="text-sm text-muted">{e.countries.map(c => `${c.flag} ${c.name}`).join(" · ")}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : empty(`Everything closed to you in ${country.name} is closed everywhere Vestail covers too, or nothing is closed.`))}
    </div>
  );
}

const who = (w: string) => (w === "citizen" ? "citizens" : "foreigners");
