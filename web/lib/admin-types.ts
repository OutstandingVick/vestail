import type { BuyerType, ProductActivity, Status } from "@/lib/types";

export interface AdminUserRow {
  id: string;
  joinedAt: string;
  country: string | null;
  who: BuyerType | null;
  walletCount: number;
  hasProfile: boolean;
}

export interface CoverageCell {
  country: string;
  name: string;
  who: BuyerType;
  totals: Record<Status, number>;
}

export interface AdminHealthCheck {
  name: string;
  status: "healthy" | "attention" | "unavailable";
  detail: string;
}

export interface AdminOverview {
  generatedAt: string;
  users: { total: number; profiled: number; wallets: number; recent7d: number };
  catalog: { countries: number; assets: number; tokenSymbols: number };
  coverage: CoverageCell[];
  activity: ProductActivity;
  health: AdminHealthCheck[];
  recentUsers: AdminUserRow[];
}
