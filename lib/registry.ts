import registryJson from "@/registry/representations.json";

import { SYMBOL_ALLOWLIST, type AllowedSymbol } from "@/lib/constants";
import { RegistrySchema } from "@/lib/types";

/**
 * The representation registry, validated once at module load.
 *
 * Parsing (not casting) means a hand-edit or a sync bug that produces an
 * invalid entry fails the build, instead of rendering a wrong mint to a user
 * who is about to route money to it.
 */
export const registry = RegistrySchema.parse(registryJson);

export function isAllowedSymbol(value: string): value is AllowedSymbol {
  return (SYMBOL_ALLOWLIST as readonly string[]).includes(value);
}

export function getSymbolEntry(symbol: AllowedSymbol) {
  const entry = registry.symbols[symbol];
  if (!entry) {
    throw new Error(
      `${symbol} is allowlisted but missing from the registry; run npm run registry:sync`,
    );
  }
  return entry;
}

/** The registry entry for a mint, or undefined if Vestail does not know it. */
export function findRepresentation(mint: string) {
  for (const entry of Object.values(registry.symbols)) {
    const found = entry.representations.find((r) => r.mint === mint);
    if (found) return found;
  }
  return undefined;
}
