import Link from "next/link";

import { AssetBoard } from "@/components/AssetBoard";
import { GiantSearch } from "@/components/GiantSearch";
import { ProfileBar } from "@/components/ProfileBar";
import { Trail } from "@/components/Trail";
import { VerdictBadge } from "@/components/VerdictBadge";
import { api } from "@/lib/server/api";
import { readProfile } from "@/lib/server/profile";
import { ONCHAIN_CLASSES, symbolsFor } from "@/lib/tokens";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim();
  const [profile, countries, assets, categories, tokenSymbols] = await Promise.all([
    readProfile(), api.countries(), api.assets(), api.categories(), api.tokenSymbols(),
  ]);
  const country = profile && countries.find(c => c.code === profile.country);
  const nameOf = new Map(assets.map(a => [a.id, a.name]));

  const [board, hit] = country
    ? await Promise.all([
        api.matrix({ who: profile.who, countries: profile.country, sort: "asset" }),
        q ? api.matrix({ q, who: profile.who, countries: profile.country }) : Promise.resolve(null),
      ])
    : [null, null];
  const matches = hit ? symbolsFor(q, hit.resolution, tokenSymbols) : [];

  return (
    <>
      <section className={`flex flex-col items-center justify-center gap-6 py-12 text-center ${q ? "" : "min-h-[72vh]"}`}>
        <GiantSearch q={q} />
        <ProfileBar countries={countries} profile={profile} />
      </section>

      {!country && (
        <p className="rounded-panel bg-surface p-8 text-center text-muted">
          Choose your country above to see what you can own there. We show nothing until you do.
        </p>
      )}

      {country && hit && (
        <section aria-labelledby="results-title" className="flex flex-col gap-5 rounded-panel bg-surface p-6 sm:p-8">
          <h2 id="results-title" className="sr-only">Results</h2>
          {hit.resolution.stage === "none" ? (
            <p className="text-muted">
              Nothing matched “{q}”. Try a company, an everyday word like “house”, or pick from the asset classes below.
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

      {board && (
        <AssetBoard cells={board.rows[0].cells} assets={assets} categories={categories} onchain={ONCHAIN_CLASSES} />
      )}
    </>
  );
}
