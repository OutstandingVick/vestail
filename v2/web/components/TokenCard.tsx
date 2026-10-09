import Image from "next/image";

import { NotAssessedBadge, VerdictBadge } from "@/components/VerdictBadge";
import { CHAIN_LABEL, INSTRUMENT_LABEL } from "@/lib/instrument";
import type { Token } from "@/lib/types";

const STRUCTURE: Record<string, string> = {
  custody_backed: "Custody-backed certificate: the real share held 1:1 by a custodian",
  total_return_note: "Debt note tracking the price; no shareholder rights",
  security_entitlement: "Entitlement to a share held through a broker",
};
const LOGO = new Set(["xstocks", "ondo", "backpack", "tessera", "prestocks"]);
const ISSUER: Record<string, string> = {
  xstocks: "xStocks (Backed Finance)", ondo: "Ondo Global Markets", backpack: "Backpack Securities",
  tessera: "Tessera", prestocks: "PreStocks", robinhood: "Robinhood (Jersey)", coinbase: "Coinbase",
};

/** One onchain version: its issuer's claim, its own verdict, and the sources behind it. */
export function TokenCard({ token }: { token: Token }) {
  const gates = token.issuer?.evidence.filter(e => e.kind === "gate") ?? [];
  return (
    <article className="flex flex-col gap-2.5 rounded-card bg-wash p-[18px]">
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        <span className="flex items-center gap-3">
          {/* Issuer logos are wide wordmarks: these files are white (drawn for dark sites), so they sit on a wide dark slot in both themes. */}
          {LOGO.has(token.provider)
            ? <span className="flex h-9 w-[84px] shrink-0 items-center justify-center rounded-lg bg-[#141414] px-2 ring-1 ring-line">
                <Image src={`/issuers/${token.provider}.svg`} alt={`${ISSUER[token.provider] ?? token.provider} logo`} width={72} height={24} className="h-5 w-auto max-w-full object-contain" />
              </span>
            : <span aria-hidden="true" className="flex h-9 w-[84px] shrink-0 items-center justify-center rounded-lg bg-tint text-sm font-bold">{ISSUER[token.provider]?.split(" ")[0] ?? token.provider}</span>}
          <span className="flex flex-col">
            <strong className="text-[17px]">{token.token_symbol} · {ISSUER[token.provider] ?? token.provider}</strong>
            <span className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted">
              <span className="rounded-full bg-tint px-2 py-0.5 text-xs font-semibold text-ink">{CHAIN_LABEL[token.chain] ?? token.chain}</span>
              <span className="rounded-full border border-field px-2 py-0.5 text-xs font-semibold text-ink" title={INSTRUMENT_LABEL[token.instrument]?.explain}>
                {INSTRUMENT_LABEL[token.instrument]?.label ?? token.instrument}
              </span>
              {STRUCTURE[token.structure] ?? INSTRUMENT_LABEL[token.instrument]?.explain}
            </span>
          </span>
        </span>
        {token.status ? <VerdictBadge status={token.status} /> : <NotAssessedBadge />}
      </div>
      {!token.assessed ? (
        <p className="text-[15px]">{token.status === "cannot_own"
          ? "Your country's rule for this asset class forbids it, whatever the issuer allows."
          : "This issuer has no rule for your country yet, so we can't say. Vestail won't route it until someone checks."}</p>
      ) : (
        <>
          <p className="text-[15px]">{token.issuer?.summary}</p>
          {token.decided_by === "class" && (
            <p className="text-sm text-muted">The issuer allows more, but your country&apos;s asset-class rule is stricter, so that decides.</p>
          )}
          {gates.length > 0 && (
            <p className="text-[13px] text-muted">
              Source:{" "}
              {gates.map((g, i) => (
                <span key={g.rule}>
                  {i > 0 && ", "}
                  <a href={g.source_url} target="_blank" rel="noreferrer" className="text-emphasis underline">issuer terms</a>
                  {g.source_quality === "secondary" && " (secondary source)"}
                </span>
              ))}
              {" · policy "}{token.issuer?.policy_version}
            </p>
          )}
        </>
      )}
    </article>
  );
}
