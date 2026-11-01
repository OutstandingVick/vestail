import type { Instrument } from "@/lib/types";

// Instrument labels keep a positive verdict from implying ownership of the underlying asset.
export const INSTRUMENT_LABEL: Record<Instrument, { label: string; explain: string }> = {
  tokenized_equity: { label: "Tokenized share", explain: "A claim on a real share held 1:1 by a custodian." },
  tokenized_debt: { label: "Debt token", explain: "A note that tracks the price. No rights in the share." },
  broker_entitlement: { label: "Broker entitlement", explain: "A share held for you through a broker." },
  contractual_exposure: { label: "Contractual exposure", explain: "An SPV or loan participation that tracks the company." },
};

export const CHAIN_LABEL: Record<string, string> = { solana: "Solana", robinhood: "Robinhood Chain", base: "Base" };
