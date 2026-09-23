import { POLICIES } from "@/lib/policies";
import { registry } from "@/lib/registry";
import { REGION_ALLOWLIST } from "@/lib/constants";

/**
 * The numbers quoted in the docs, counted from the registry and the policy
 * files rather than typed into prose.
 *
 * Docs that state figures by hand go stale the first time the data moves,
 * and a stale figure in a document about trust is worse than no figure. All
 * of this is computed at build time; nothing here runs per request.
 */
export interface DocsStats {
  symbols: number;
  mints: number;
  providers: number;
  regions: number;
  /** Mints whose issuer can freeze the token in your wallet. */
  freezable: number;
  /** Sourced rules across every policy file. */
  rules: number;
  /** Rules whose source is the issuer's own document. */
  primaryRules: number;
  /** The most versions any one symbol has. */
  mostVersions: { symbol: string; count: number };
}

export function docsStats(): DocsStats {
  const entries = Object.entries(registry.symbols);
  const reps = entries.flatMap(([, entry]) => entry.representations);

  const most = entries.reduce(
    (best, [symbol, entry]) =>
      entry.representations.length > best.count
        ? { symbol, count: entry.representations.length }
        : best,
    { symbol: "", count: 0 },
  );

  const rules = Object.values(POLICIES).flatMap((p) => p.rules);

  return {
    symbols: entries.length,
    mints: reps.length,
    providers: new Set(reps.map((r) => r.provider)).size,
    regions: REGION_ALLOWLIST.length,
    freezable: reps.filter((r) => r.freezeAuthority !== null).length,
    rules: rules.length,
    primaryRules: rules.filter((r) => r.source_quality === "primary").length,
    mostVersions: most,
  };
}
