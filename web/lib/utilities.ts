import type { UtilityName, UtilityOption, UtilityRisk, UtilityVerdict } from "@/lib/types";

export function canAct(option: Pick<UtilityOption, "actionsEnabled" | "acknowledgementRequired">, acknowledged: boolean): boolean {
  if (!option.actionsEnabled) return false;
  return !option.acknowledgementRequired || acknowledged;
}

export function blockedReason(option: Pick<UtilityOption, "verdict" | "actionsEnabled" | "acknowledgementRequired">, acknowledged: boolean): string | null {
  if (option.verdict === "restricted") return "Not allowed where you are.";
  if (option.verdict === "unverified") return "Not verified for your country yet, so Vestail won't route it.";
  if (!option.actionsEnabled) return "Unavailable.";
  if (option.acknowledgementRequired && !acknowledged) return "Tick the acknowledgement first.";
  return null;
}

export const UTILITY_LABEL: Record<UtilityName, { title: string; blurb: string }> = {
  hold: { title: "Hold", blurb: "Own it in your wallet." },
  trade: { title: "Trade", blurb: "Swap it spot for USDC or SOL. No leverage." },
  lend: { title: "Lend", blurb: "Supply it to a lending protocol for interest." },
  borrow: { title: "Borrow against", blurb: "Use it as collateral to borrow." },
  earn: { title: "Earn", blurb: "Provide liquidity on Meteora and earn trading fees." },
};

export const VERDICT_LABEL: Record<UtilityVerdict, string> = {
  eligible: "Eligible", conditional: "Conditional", restricted: "Restricted", unverified: "Unverified",
};

export const RISK_TEXT: Record<UtilityRisk, string> = {
  liquidation: "If the asset's price falls far enough, your position can be liquidated and you can lose your collateral.",
  impermanent_loss: "Providing liquidity exposes you to impermanent loss: if prices move, you can end up with less value than simply holding, even after fees. Pools can also lose value outright.",
};
