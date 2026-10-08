/**
 * Shapes of the v2 API's responses (docs/api/openapi.yaml). Only the fields
 * the app reads are typed.
 */

export type Status = "can_own" | "conditional" | "cannot_own";
export type BuyerType = "citizen" | "foreigner";
export const BUYER_TYPES: readonly BuyerType[] = ["citizen", "foreigner"];

export interface Country { code: string; name: string; flag: string }
export interface Asset { id: string; index: number; name: string }
export interface Category { id: string; name: string; assets: string[] }
export interface Venue { name: string; url: string | null }
export interface Source { title: string; url: string }

export interface Resolution {
  stage: "entity" | "alias" | "category" | "asset" | "all" | "none";
  assets: string[];
  entity?: { name: string; kind: string; home?: string; asset?: string };
  trail: string[];
  note?: string;
}

export interface Cell { asset: string; index: number; status: Status }
export interface MatrixRow {
  code: string; name: string; flag: string; who: BuyerType;
  cells: Cell[];
  summary: Record<Status, number>;
  cta: { asset: string; status: Status; venues: Venue[] } | null;
}
export interface Matrix { query: string; who: BuyerType; resolution: Resolution; rows: MatrixRow[] }

export interface Rule {
  country: string; asset: string; who: BuyerType; status: Status;
  venues: Venue[];
  sources: Source[];
  verified_at: string | null;
}

export interface TokenSymbol { symbol: string; name: string; entity: string | null; home: string; providers: string[]; chains: Chain[]; mints: string[] }
export interface Order { id: string; at: string; country: string; asset: string; who: BuyerType; venue: string; mint?: string; market?: string; chain?: Chain; acknowledged: boolean }

/** A Hyperliquid perpetual judged for a country: price exposure, never ownership. */
export interface Market {
  id: string; coin: string; name: string; commodity: string; related_asset: string | null;
  venue: string; chain: "hyperliquid"; deployer: string; instrument: "commodity_derivative";
  country?: string; assessed?: boolean; status?: Status | null;
  issuer?: Token["issuer"];
}

export interface IssuerEvidence { rule: string; kind: "gate" | "note"; reason: string; source_url: string; source_quality: "primary" | "secondary" }
export type Chain = "solana" | "robinhood" | "base" | "hyperliquid";
export type Instrument = "tokenized_equity" | "tokenized_debt" | "broker_entitlement" | "contractual_exposure" | "commodity_derivative";
export interface Token {
  mint: string; address: string; chain: Chain; chain_name: string; instrument: Instrument; provider: string; token_symbol: string; name: string; structure: string;
  redeemable: boolean; custodian: string | null; decimals: number; token_program: string; issuer_source: string;
  /** False when the issuer has no rule for the country. Not assessed is never buyable. */
  assessed: boolean;
  status: Status | null;
  decided_by: "issuer" | "class" | "both" | null;
  issuer: {
    status: Status; summary: string | null;
    acknowledgement: { limit: string; requires: string } | null;
    policy_version: string; evidence: IssuerEvidence[];
  } | null;
}
export interface TokenBoard {
  symbol: string; name: string; country: string; who: BuyerType;
  asset: string; class_status: Status;
  class_sources: Source[]; class_verified_at: string | null;
  tokens: Token[];
}

export interface Profile { country: string; who: BuyerType }

/** A tokenised stock the user holds, with its value and its verdict for their declared country. */
export interface Holding {
  mint: string; symbol: string; token_symbol: string; name: string; provider: string;
  amount: number; usd: number | null; status: Status | null; asset: string;
}
export interface WatchItem { asset: string; symbol?: string; added: string }
export interface Portfolio {
  wallets: string[];
  totals: { usd: number; holdings_usd: number; cash_usd: number; unpriced: number };
  cash: { sol: number; sol_usd: number | null; usdc: number };
  holdings: Holding[];
  orders: Order[];
  watchlist: (WatchItem & { name: string; status: Status })[];
  history: { day: string; usd: number }[];
  errors: string[];
}
