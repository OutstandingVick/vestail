import { Out } from "@/components/docs/blocks";
import { docsProviders } from "@/lib/docs/providers";
import { monogram } from "@/lib/labels";

/**
 * The five issuers side by side: what each token legally is, and who the
 * holder's claim runs against.
 *
 * A stack of rows rather than a <table>: on a phone a five-column table
 * either scrolls sideways or shrinks past reading size, and the comparison
 * here is one issuer at a time, not a grid to scan across.
 */
export function IssuerTable() {
  return (
    <ul className="space-y-px overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10">
      {docsProviders().map((p) => (
        <li key={p.provider} className="bg-brand-navy/80 p-5">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white"
            >
              {monogram(p.name)}
            </span>
            <div className="min-w-0">
              <p className="font-bold text-white">{p.name}</p>
              <p className="truncate text-sm text-white/50">{p.issuer}</p>
            </div>
          </div>

          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-bold uppercase tracking-widest text-white/40">
                What the token is
              </dt>
              <dd className="mt-1 text-sm leading-snug text-white/80">{p.plain}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-widest text-white/40">
                Your claim runs against
              </dt>
              <dd className="mt-1 text-sm leading-snug text-white/80">{p.claimAgainst}</dd>
            </div>
          </dl>

          <p className="mt-3 text-sm text-white/50">
            {p.custodian ? `Custodian: ${p.custodian}. ` : ""}
            <Out href={p.sourceUrl}>Issuer&apos;s own terms</Out>
          </p>
        </li>
      ))}
    </ul>
  );
}
