import backpack from "@/policies/backpack.json";
import ondo from "@/policies/ondo.json";
import prestocks from "@/policies/prestocks.json";
import tessera from "@/policies/tessera.json";
import xstocks from "@/policies/xstocks.json";

import { PolicyFileSchema, type PolicyFile, type Provider } from "@/lib/types";

/**
 * Every issuer policy, parsed and validated at module load.
 *
 * Imported statically (not read from disk) so the same validated rules run
 * on the server and in the browser: evaluation is client-side, and switching
 * the declared region costs no request. The rules are public anyway — every
 * one of them links its source.
 *
 * Keyed by provider so a missing file is a type error, not a runtime gap.
 */
const raw: Record<Provider, unknown> = {
  xstocks,
  ondo,
  backpack,
  tessera,
  prestocks,
};

export const POLICIES = Object.fromEntries(
  Object.entries(raw).map(([provider, json]) => {
    const policy = PolicyFileSchema.parse(json);
    if (policy.provider !== provider) {
      throw new Error(
        `policies/${provider}.json declares provider "${policy.provider}"`,
      );
    }
    return [provider, policy];
  }),
) as Record<Provider, PolicyFile>;
