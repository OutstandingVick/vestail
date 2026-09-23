import { docsStats } from "@/lib/docs/stats";

/**
 * The scale of the thing, in four figures, straight from the data.
 *
 * A definition list rather than a grid of divs: each figure is the value of
 * a named term, and that is exactly what a screen reader should hear.
 */
export function Stats() {
  const s = docsStats();
  const items: Array<[string, string]> = [
    [String(s.mints), "tokens tracked"],
    [String(s.symbols), "companies and funds"],
    [String(s.providers), "issuers, each a different legal claim"],
    [`${s.primaryRules}/${s.rules}`, "rules sourced to the issuer's own document"],
  ];

  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/10 ring-1 ring-white/10 sm:grid-cols-4">
      {items.map(([value, label]) => (
        <div key={label} className="bg-brand-navy/80 p-4">
          <dt className="sr-only">{label}</dt>
          <dd>
            <span className="block text-3xl font-bold text-white">{value}</span>
            <span aria-hidden className="mt-1 block text-sm leading-snug text-white/60">
              {label}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}
