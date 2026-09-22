/**
 * The main button's label and whether it can be pressed, as a pure function
 * of the page state, so the rules can be tested without a browser.
 *
 * Order matters: the first unmet step is the one the button asks for.
 * No imports that run, so Node's test runner can load this file directly.
 */

export type VersionStatus = "eligible" | "conditional" | "restricted" | "not_assessed";

export interface BuyButtonInput {
  walletConnected: boolean;
  countryChosen: boolean;
  stockChosen: boolean;
  /** Verdict of the selected version; null when none is selected. */
  selectedStatus: VersionStatus | null;
  selectedTokenSymbol: string | null;
  /** Typed amount in the pay token's base units; null if empty or invalid. */
  amount: bigint | null;
  minAmount: bigint;
  minAmountLabel: string;
  /** Pay-token balance in base units; null when unknown. */
  balance: bigint | null;
  payTokenSymbol: string;
  estimate: "idle" | "loading" | "ready" | "no_route" | "error";
  acknowledged: boolean;
  /** Signing or executing right now. */
  busy: "signing" | "executing" | null;
}

export type BuyButtonKind =
  | "connect"
  | "choose"
  | "pick_version"
  | "amount"
  | "minimum"
  | "insufficient"
  | "no_route"
  | "acknowledge"
  | "busy"
  | "ready";

export interface BuyButtonState {
  kind: BuyButtonKind;
  label: string;
  /** "connect" and "ready" are the only pressable states. */
  enabled: boolean;
}

export function buyButtonState(s: BuyButtonInput): BuyButtonState {
  if (s.busy === "signing") return { kind: "busy", label: "Confirm in your wallet…", enabled: false };
  if (s.busy === "executing") return { kind: "busy", label: "Buying…", enabled: false };

  if (!s.walletConnected) return { kind: "connect", label: "Connect wallet", enabled: true };

  if (!s.countryChosen || !s.stockChosen) {
    return { kind: "choose", label: "Choose a country and stock", enabled: false };
  }

  // Restricted and unassessed versions can never be the one being bought:
  // treat them as nothing selected, whatever state got us here.
  const buyable = s.selectedStatus === "eligible" || s.selectedStatus === "conditional";
  if (!buyable || !s.selectedTokenSymbol) {
    return { kind: "pick_version", label: "Pick a version below", enabled: false };
  }

  if (s.amount === null || s.amount === BigInt(0)) {
    return { kind: "amount", label: "Enter an amount", enabled: false };
  }
  if (s.amount < s.minAmount) {
    return { kind: "minimum", label: `Minimum is ${s.minAmountLabel}`, enabled: false };
  }
  if (s.balance !== null && s.amount > s.balance) {
    return { kind: "insufficient", label: `Not enough ${s.payTokenSymbol}`, enabled: false };
  }
  if (s.estimate === "no_route") {
    return { kind: "no_route", label: "No route found", enabled: false };
  }

  if (s.selectedStatus === "conditional" && !s.acknowledged) {
    return { kind: "acknowledge", label: "Review the conditions below", enabled: false };
  }

  return { kind: "ready", label: `Buy ${s.selectedTokenSymbol}`, enabled: true };
}
