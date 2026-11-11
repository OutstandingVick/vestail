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
export interface ActivityItem extends Order {
  name: string;
  symbol?: string;
  chain_label?: string;
  country_label?: string;
}

export interface ProductActivity {
  stats: {
    volume_30d_usd: number;
    volume_30d_delta_pct: number;
    orders_routed: number;
    orders_delta_pct: number;
    active_buyers_7d: number;
  };
  recent: { flag: string; asset: string; venue: string; ago: string }[];
}

export interface IssuerEvidence { rule: string; kind: "gate" | "note"; reason: string; source_url: string; source_quality: "primary" | "secondary" }
export type Chain = "solana" | "robinhood" | "base";
export type Instrument = "tokenized_equity" | "tokenized_debt" | "broker_entitlement" | "contractual_exposure";
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

export interface Holding {
  mint: string; symbol: string; token_symbol: string; name: string; provider: string; chain: Chain;
  amount: number; usd: number | null; status: Status | null; asset: string;
}
export interface WatchItem { asset: string; symbol?: string; added: string }
export interface WatchQuote {
  price_usd: number;
  change_24h_pct: number | null;
  liquidity_usd: number | null;
  token_symbol: string;
  provider: string;
  mint: string;
  as_of: string;
}
export interface WatchlistRow extends WatchItem {
  name: string;
  status: Status;
  quote: WatchQuote | null;
  /** USD depth across the stock's Meteora USDC/SOL pools; null when Earn isn't available here or the read failed. */
  meteoraDepthUsd?: number | null;
}
export interface Portfolio {
  wallets: string[];
  evm_wallets: string[];
  totals: { usd: number; holdings_usd: number; cash_usd: number; unpriced: number };
  cash: { sol: number; sol_usd: number | null; usdc: number; eth: { base: number; robinhood: number }; eth_usd: number };
  holdings: Holding[];
  orders: Order[];
  watchlist: (WatchItem & { name: string; status: Status })[];
  history: { day: string; usd: number }[];
  errors: string[];
}

/** /api/v1/utilities: what a holder may do with an asset, and whether they may. */
export type UtilityVerdict = "eligible" | "conditional" | "restricted" | "unverified";
export type UtilityName = "hold" | "trade" | "lend" | "borrow" | "earn";
export type UtilityRisk = "liquidation" | "impermanent_loss";
export interface JupiterPair {
  pair: "USDC" | "SOL"; available: boolean; note?: string;
  reference?: { spend: number; spendSymbol: string; receive: number };
  pricePerToken?: number | null; priceImpactPct?: number; venues?: string[];
}
export interface MeteoraPool {
  address: string; kind: "dlmm" | "damm_v2"; name: string; pair: "USDC" | "SOL";
  tvlUsd: number | null; volume24hUsd: number | null; fees24hUsd: number | null;
  feeTvl24hPct: number | null; feeAprPct: number | null; binStep: number | null; baseFeePct: number | null;
}
export interface UtilityOption {
  protocol: string; name: string; version: string; verifiedOn: string | null;
  verdict: UtilityVerdict; protocolVerdict: UtilityVerdict; holdVerdict: UtilityVerdict;
  reasons: string[]; sources: { label: string; url: string; quality?: string }[];
  action: string; pairs: string[]; pools: string[]; risk: UtilityRisk | null;
  actionsEnabled: boolean; acknowledgementRequired: boolean;
  live: { pairs?: JupiterPair[]; depthUsd?: number; pools?: MeteoraPool[] } | null;
  liveError?: string;
}
export interface Utility {
  utility: UtilityName; verdict: UtilityVerdict; options: UtilityOption[];
  actionsEnabled: boolean; acknowledgementRequired: boolean; risk: UtilityRisk | null; reasons?: string[];
}
export interface UtilitiesVersion {
  asset: { symbol: string; id: string; tokenSymbol: string; name: string; issuer: string; chain: string; instrument: string };
  utilities: Utility[];
}
export interface Utilities { country: string; residency: string; versions: UtilitiesVersion[]; disclaimer: string }
