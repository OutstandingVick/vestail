import type { UtilityName, UtilityOption, UtilityRisk, UtilityVerdict } from "@/lib/types";

/**
 * The one rule every utility button follows. An action may start only when
 * its option is enabled (eligible or conditional) and, where an
 * acknowledgement is required (a conditional verdict, or the risk of lending,
 * borrowing or providing liquidity), only after the buyer has given it.
 */
export function canAct(option: Pick<UtilityOption, "actionsEnabled" | "acknowledgementRequired">, acknowledged: boolean): boolean {
  if (!option.actionsEnabled) return false;
  return !option.acknowledgementRequired || acknowledged;
}

/** Why a button is off, in words the buyer can act on. Null when it's on. */
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
