import { ArrowLeft, ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { ActionPanel } from "@/components/ActionPanel";
import { Provenance } from "@/components/Provenance";
import { PurchaseModal } from "@/components/PurchaseModal";
import { TokenCard } from "@/components/TokenCard";
import { VerdictBadge } from "@/components/VerdictBadge";
import { WatchButton } from "@/components/WatchButton";
import { api } from "@/lib/server/api";
import { readProfile } from "@/lib/server/profile";
import { ONCHAIN_CLASSES } from "@/lib/tokens";
import type { TokenBoard } from "@/lib/types";

export default async function AssetPage({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ symbol?: string; canonical?: string; buy?: string }>;
}) {
  const { id } = await params;
  const { symbol, canonical, buy } = await searchParams;
  const [profile, assets, countries, symbols] = await Promise.all([readProfile(), api.assets(), api.countries(), api.tokenSymbols()]);
  const asset = assets.find(a => a.id === id);
  if (!asset) notFound();
  if (!profile) {
    return <p className="mt-12 rounded-panel bg-surface p-8 text-center text-muted">Choose your country on the <Link href="/app/start" className="text-emphasis underline">search page</Link> first.</p>;
  }
  const country = countries.find(c => c.code === profile.country)!;
  const rule = await api.rule(profile.country, id, profile.who);

  // A ticker only belongs here if this is the class that governs it in this country.
  let board: TokenBoard | null = null;
  if (symbol && ONCHAIN_CLASSES.has(id) && symbols.some(s => s.symbol === symbol)) {
    const b = await api.tokens(symbol, profile.country, profile.who);
    if (!canonical) redirect(`/app/assets/${encodeURIComponent(b.name.toLowerCase())}`);
    // NVDA is domestic equity in the US and foreign everywhere else: send the buyer to the class that governs it here.
    if (b.asset !== id) redirect(`/app/asset/${b.asset}?symbol=${symbol}`);
    board = b;
  }
  const others = ONCHAIN_CLASSES.has(id) && !board ? symbols : [];
  const selectedToken = buy ? board?.tokens.find(token => token.token_symbol.toLowerCase() === buy.toLowerCase()) : undefined;
  const cleanHref = board ? `/app/assets/${encodeURIComponent(board.name.toLowerCase())}` : `/app/asset/${id}`;

  return (
    <div className="mt-8 flex flex-col gap-4">
      <Link
        href={board ? `/app/discover/${id}/${encodeURIComponent(board.name)}` : "/app/discover"}
        className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-line bg-surface px-4 font-semibold hover:border-field hover:bg-wash"
      >
        <ArrowLeft size={18} weight="bold" aria-hidden="true" />
        Back to results
      </Link>
      <p className="text-[13px] font-semibold tracking-[0.08em] text-muted uppercase">
        <Link href="/app/discover" className="hover:text-ink">Discover</Link> / {asset.name}{board && ` / ${board.name}`}
      </p>
      <div className="flex flex-col gap-4">
        <div className="flex min-w-0 flex-col gap-4">
          <section className="flex flex-col gap-4 rounded-panel bg-surface p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-[28px] font-bold">{asset.name} in {country.name}</h1>
              <div className="flex items-center gap-2">
                <WatchButton asset={id} symbol={board?.symbol} label={board?.name ?? asset.name} />
                <VerdictBadge status={rule.status} size="lg" />
              </div>
            </div>
            <p className="text-muted">The asset-class rule for a {profile.who} of {country.flag} {country.name}. It applies to every {asset.name.toLowerCase()} holding, however it&apos;s held.</p>
            <Provenance sources={rule.sources} verifiedAt={rule.verified_at} />
            <Link href={`/app/compare?asset=${id}`} className="inline-flex items-center gap-1 text-[15px] font-semibold text-emphasis">Compare {asset.name.toLowerCase()} across all countries <ArrowRight size={16} weight="regular" aria-hidden="true" /></Link>
          </section>

          {board && (
            <section aria-labelledby="tokens-title" className="flex flex-col gap-3.5 rounded-panel bg-surface p-7">
              <div>
                <h2 id="tokens-title" className="text-[22px] font-bold">{board.name} onchain</h2>
                <p className="text-[15px] text-muted">Same ticker, different legal claims, on {[...new Set(board.tokens.map(t => t.chain_name))].join(", ")}. Each is judged by its issuer&apos;s own terms; the stricter of the issuer rule and the class rule decides.</p>
              </div>
              <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
                {board.tokens.map(t => (
                  <TokenCard
                    key={t.mint}
                    token={t}
                    buyHref={(t.status === "can_own" || t.status === "conditional") ? `${cleanHref}?buy=${encodeURIComponent(t.token_symbol)}` : undefined}
                  />
                ))}
              </div>
            </section>
          )}

          {others.length > 0 && (
            <section className="flex flex-col gap-3 rounded-panel bg-surface p-7">
              <h2 className="text-[22px] font-bold">Onchain versions</h2>
              <p className="text-[15px] text-muted">Tokenised stocks that may fall under this class. Pick one to see each version&apos;s verdict.</p>
              <div className="flex flex-wrap gap-2">
                {others.map(s => (
                  <Link key={s.symbol} href={`/app/assets/${encodeURIComponent(s.name.toLowerCase())}`} className="rounded-full border border-line bg-wash px-3.5 py-2 text-sm hover:border-field">
                    {s.name} <span className="text-muted">{s.symbol}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>

      </div>
      {selectedToken && board && (
        <PurchaseModal closeHref={cleanHref}>
          <ActionPanel assetId={id} assetName={asset.name} classStatus={rule.status} venues={rule.venues} symbol={board.symbol} tokens={[selectedToken]} />
        </PurchaseModal>
      )}
    </div>
  );
}
