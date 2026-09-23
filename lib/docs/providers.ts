import providersJson from "@/registry/providers.json";

import { STRUCTURE_PLAIN, PROVIDER_NAME } from "@/lib/labels";
import { ProviderSchema, StructureSchema, type Provider, type Structure } from "@/lib/types";

/** One issuer, as the docs describe it. */
export interface DocsProvider {
  provider: Provider;
  name: string;
  issuer: string;
  structure: Structure;
  /** The one-line plain English for that structure. */
  plain: string;
  custodian: string | null;
  sourceUrl: string;
  /** What the holder's claim actually runs against. */
  claimAgainst: string;
}

/**
 * Who the holder's claim runs against, per issuer. This is the distinction a
 * wallet cannot show and the reason the structures matter: "backed by the
 * share" and "a note from a company that tracks the share" price the same
 * and behave the same right up until the issuer is in trouble.
 */
const CLAIM_AGAINST: Record<Provider, string> = {
  xstocks: "A share held in custody, through a Swiss tracker certificate",
  ondo: "Ondo itself — the note tracks the price, you do not own the share",
  backpack: "A licensed broker-dealer, under UCC Article 8",
  prestocks: "A holding vehicle, with no shareholder rights",
  tessera: "A per-company issuer that repays only on a listing or sale",
};

/** The issuer facts from the registry, typed and ordered for the docs. */
export function docsProviders(): DocsProvider[] {
  const order: Provider[] = ["xstocks", "ondo", "backpack", "tessera", "prestocks"];

  return order.map((provider) => {
    const raw = (providersJson as Record<string, unknown>)[provider] as {
      issuer: string;
      structure: string;
      custodian: string | null;
      sourceUrl: string;
    };
    const structure = StructureSchema.parse(raw.structure);
    return {
      provider: ProviderSchema.parse(provider),
      name: PROVIDER_NAME[provider],
      issuer: raw.issuer,
      structure,
      plain: STRUCTURE_PLAIN[structure],
      custodian: raw.custodian,
      sourceUrl: raw.sourceUrl,
      claimAgainst: CLAIM_AGAINST[provider],
    };
  });
}
