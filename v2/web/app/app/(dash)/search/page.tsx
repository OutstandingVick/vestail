import Link from "next/link";

import { CountryBoard } from "@/components/CountryBoard";
import { DiscoverExplorer } from "@/components/DiscoverExplorer";
import { GiantSearch } from "@/components/GiantSearch";
import { ProfileBar } from "@/components/ProfileBar";
import { Trail } from "@/components/Trail";
import { VerdictBadge } from "@/components/VerdictBadge";
import { api } from "@/lib/server/api";
import { loadDiscovery } from "@/lib/server/discovery";
import { readProfile } from "@/lib/server/profile";
import { BUYER_TYPES, type BuyerType } from "@/lib/types";
import { ONCHAIN_CLASSES, symbolsFor } from "@/lib/tokens";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; who?: string; sort?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const [profile, countries, assets, tokenSymbols] = await Promise.all([
    readProfile(), api.countries(), api.assets(), api.tokenSymbols(),
  ]);
  const country = profile && countries.find(c => c.code === profile.country);
  const nameOf = new Map(assets.map(a => [a.id, a.name]));
  const boardWho: BuyerType = BUYER_TYPES.includes(sp.who as BuyerType) ? (sp.who as BuyerType) : profile?.who ?? "citizen";
  const boardSort = sp.sort === "asset" ? "asset" : "status";

  // Nothing but the search until the buyer searches; then the answer for their
  // own country, and the board of every country for the same query.
  const [hit, board] = country && q
    ? await Promise.all([
        api.matrix({ q, who: profile.who, countries: profile.country }),
        api.matrix({ q, who: boardWho, sort: boardSort }),
      ])
    : [null, null];
  const matches = hit ? symbolsFor(q, hit.resolution, tokenSymbols) : [];
  const exposures = q ? await api.derivatives(q).catch(() => []) : [];
  const discovery = profile ? await loadDiscovery(profile) : null;

  return (
    <>
      <section className={`flex flex-col items-center justify-center gap-6 pt-8 text-center ${q ? "" : "min-h-[50vh]"}`}>
        <GiantSearch q={q} />
        <ProfileBar countries={countries} profile={profile} />
      </section>

      {country && hit && (
        <section aria-labelledby="results-title" className="flex flex-col gap-5 rounded-panel bg-surface p-6 sm:p-8">
          <h2 id="results-title" className="sr-only">Results</h2>
          {hit.resolution.stage === "none" && matches.length > 0 ? (
            <ul className="flex flex-col gap-3">
              {matches.map(m => (
                <li key={m.symbol}>
                  {/* The asset page sends a ticker to the class that governs it in this country. */}
                  <Link href={`/app/asset/${m.entity ? "foreign_equities" : "private_company_shares"}?symbol=${m.symbol}`}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-card bg-tint px-5 py-4 hover:ring-2 hover:ring-field">
                    <span className="flex flex-col gap-1">
                      <strong className="text-lg">{m.name} <span className="font-normal text-muted">{m.symbol}</span></strong>
                      <span className="text-sm text-muted">{m.providers.length} tokenized version{m.providers.length > 1 ? "s" : ""} · {m.chains.length > 1 ? `${m.chains.length} chains` : "Solana"}</span>
                    </span>
                    <span className="rounded-full bg-surface px-3 py-1.5 text-[13px] font-semibold">See versions →</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : hit.resolution.stage === "none" ? (
            <p className="text-muted">
              {exposures.length
                ? `“${q}” isn't an asset class you can own directly, but there's price exposure to it below.`
                : `Nothing matched “${q}”. Try a company, an everyday word like “house”, or pick from the asset classes below.`}
            </p>
          ) : (
            <>
              <Trail q={q} resolution={hit.resolution} />
              <ul className="flex flex-col gap-3">
                {hit.rows[0].cells.map(cell => {
                  const symbols = ONCHAIN_CLASSES.has(cell.asset) ? matches : [];
                  const href = `/app/asset/${cell.asset}${symbols[0] ? `?symbol=${symbols[0].symbol}` : ""}`;
                  return (
                    <li key={cell.asset}>
                      <Link href={href} className="flex flex-wrap items-center justify-between gap-4 rounded-card bg-tint px-5 py-4 hover:ring-2 hover:ring-field">
                        <span className="flex flex-col gap-1">
                          <strong className="text-lg">
                            {nameOf.get(cell.asset)}
                            {symbols[0] && ` · ${symbols[0].name}`}
                          </strong>
                          <span className="text-sm text-muted">
                            {country.flag} {country.name}, as a {profile!.who}
                            {symbols[0] && ` · ${symbols[0].providers.length} onchain versions on Solana`}
                          </span>
                        </span>
                        <VerdictBadge status={cell.status} size="lg" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </section>
      )}

      {country && exposures.length > 0 && (
        <section aria-labelledby="exposure-title" className="flex flex-col gap-3 rounded-panel bg-surface p-6 sm:p-8">
          <div>
            <h2 id="exposure-title" className="text-lg font-bold">Price exposure on Hyperliquid</h2>
            <p className="text-sm text-muted">Not ownership: perpetual futures that track the price. You never hold the commodity.</p>
          </div>
          <ul className="flex flex-col gap-2">
            {exposures.map(m => (
              <li key={m.id}>
                <Link href={`/app/exposure/${m.coin.toLowerCase()}`} className="flex flex-wrap items-center justify-between gap-3 rounded-card bg-wash px-5 py-4 hover:ring-2 hover:ring-field">
                  <span className="flex flex-col gap-0.5">
                    <strong>{m.name} perpetual</strong>
                    <span className="text-sm text-muted">{m.id} · deployed by {m.deployer}</span>
                  </span>
                  <span className="rounded-full border-[1.5px] border-cond px-3 py-1.5 text-[13px] font-semibold">Price exposure only</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {country && board && board.resolution.stage !== "none" && (
        <CountryBoard q={q} rows={board.rows} nameOf={Object.fromEntries(nameOf)} who={boardWho} sort={boardSort} mine={country.code} />
      )}

      {discovery && (
        <DiscoverExplorer
          rows={discovery.rows}
          country={`${discovery.country.flag} ${discovery.country.name}`}
          buyer={profile!.who}
          countryCode={discovery.country.code}
        />
      )}
    </>
  );
}
