"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

import { Icon } from "@/components/icons";
import { useBuy } from "@/hooks/useBuy";
import { useEligibility } from "@/hooks/useEligibility";
import { useEstimate } from "@/hooks/useEstimate";
import { useWalletBalances } from "@/hooks/useWalletBalances";
import { buyButtonState } from "@/lib/app/buyButton";
import { defaultVersion, isSelectable } from "@/lib/app/versions";
import { fromBaseUnits, toBaseUnits } from "@/lib/amounts";
import {
  PAY_TOKENS,
  SOL_FEE_RESERVE,
  type AllowedRegion,
  type AllowedSymbol,
  type PayTokenSymbol,
} from "@/lib/constants";
import { PROVIDER_NAME } from "@/lib/labels";

import { CountrySelect, StockSelect } from "./Selectors";
import { SwapPanel, type SelectedVersion } from "./SwapPanel";
import { Toast } from "./Toast";
import { VersionCards } from "./VersionCards";

/** Smallest order per pay token; mirrors the order route's limits. */
const MINIMUM: Record<PayTokenSymbol, { units: bigint; label: string }> = {
  USDC: { units: BigInt(1_000_000), label: "1 USDC" },
  SOL: { units: BigInt(10_000_000), label: "0.01 SOL" },
};

/** A float balance in whole tokens, as base units (floored, never rounded up). */
function toUnits(amount: number, decimals: number): bigint {
  return BigInt(Math.floor(amount * 10 ** decimals));
}

/**
 * The /app card, top to bottom: where you are, which stock, what you pay
 * and get, the main button, and every version of the stock with its
 * verdict. Only eligible versions, or conditional ones the buyer has
 * acknowledged, can be bought; restricted ones never.
 */
export function SwapCard() {
  const { publicKey } = useWallet();
  const { setVisible: openWalletModal } = useWalletModal();

  const [region, setRegion] = useState<AllowedRegion | null>(null);
  const [symbol, setSymbol] = useState<AllowedSymbol | null>(null);
  const [payToken, setPayToken] = useState<PayTokenSymbol>("USDC");
  const [amount, setAmount] = useState("");
  const [selectedMint, setSelectedMint] = useState<string | null>(null);
  const [acknowledged, setAcknowledged] = useState(false);

  const { state: eligibility, retry } = useEligibility(symbol, region);
  const balances = useWalletBalances();
  const { phase, buy, reset } = useBuy();

  const versions = useMemo(
    () => (eligibility.status === "ready" ? eligibility.data.versions : []),
    [eligibility],
  );

  // New versions (a new stock or country): pre-select the strongest eligible
  // one, or nothing. Conditional versions are never pre-selected.
  useEffect(() => {
    setSelectedMint(defaultVersion(versions));
  }, [versions]);

  // A different version needs its own acknowledgement.
  useEffect(() => {
    setAcknowledged(false);
  }, [selectedMint]);

  const selectedVersion = versions.find(
    (v) => v.representation.mint === selectedMint && isSelectable(v),
  );
  const selected: SelectedVersion | null =
    selectedVersion && symbol
      ? {
          symbol,
          tokenSymbol: selectedVersion.representation.tokenSymbol,
          providerName: PROVIDER_NAME[selectedVersion.representation.provider],
          decimals: selectedVersion.representation.decimals,
        }
      : null;

  const pay = PAY_TOKENS[payToken];
  const units = toBaseUnits(amount, pay.decimals);
  const payBalance = payToken === "USDC" ? balances.usdc : balances.sol;

  const estimate = useEstimate({
    inputMint: pay.mint,
    outputMint: selectedVersion?.representation.mint ?? null,
    amount: units,
    region,
  });

  // Changing anything about the order clears the last outcome.
  useEffect(() => {
    reset();
  }, [region, symbol, payToken, amount, selectedMint, reset]);

  const busy =
    phase.kind === "ordering" || phase.kind === "signing" || phase.kind === "executing"
      ? phase.kind
      : null;

  const button = buyButtonState({
    walletConnected: Boolean(publicKey),
    countryChosen: region !== null,
    stockChosen: symbol !== null,
    selectedStatus: selectedVersion?.verdict?.status ?? null,
    selectedTokenSymbol: selected?.tokenSymbol ?? null,
    amount: units,
    minAmount: MINIMUM[payToken].units,
    minAmountLabel: MINIMUM[payToken].label,
    balance: payBalance === null ? null : toUnits(payBalance, pay.decimals),
    payTokenSymbol: payToken,
    estimate: estimate.status,
    acknowledged,
    busy,
  });

  function onMax() {
    if (payBalance === null) return;
    // Keep some SOL back: spending all of it would leave nothing for fees
    // and the accounts the swap opens, and the swap would fail.
    const spendable = payToken === "SOL" ? Math.max(0, payBalance - SOL_FEE_RESERVE) : payBalance;
    setAmount(fromBaseUnits(toUnits(spendable, pay.decimals), pay.decimals));
  }

  function onPress() {
    if (button.kind === "connect") {
      openWalletModal(true);
      return;
    }
    if (button.kind !== "ready" || !selectedVersion || !region || units === null) return;
    void buy({
      inputMint: pay.mint,
      outputMint: selectedVersion.representation.mint,
      amount: units,
      region,
      acknowledged,
    });
  }

  const closeToast = useCallback(() => reset(), [reset]);

  return (
    <>
      <section
        aria-label="Buy a tokenized stock"
        className="mx-auto w-full max-w-[480px] space-y-5 rounded-[28px] bg-brand-navy/85 p-4 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl sm:p-5"
      >
        <CountrySelect value={region} onChange={setRegion} />
        <StockSelect value={symbol} onChange={setSymbol} />

        <SwapPanel
          payToken={payToken}
          onPayTokenChange={(t) => {
            setPayToken(t);
            setAmount("");
          }}
          amount={amount}
          onAmountChange={setAmount}
          balance={publicKey ? payBalance : null}
          onMax={onMax}
          selected={selected}
          estimate={estimate}
        />

        <button
          type="button"
          onClick={onPress}
          aria-disabled={!button.enabled}
          className={`h-16 w-full rounded-2xl text-lg font-bold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
            button.enabled
              ? "bg-brand-orange text-brand-navy hover:brightness-110"
              : "cursor-not-allowed bg-brand-orange/20 text-white/75"
          }`}
        >
          {button.label}
        </button>

        <VersionCards
          state={eligibility}
          retry={retry}
          symbol={symbol}
          region={region}
          selectedMint={selectedMint}
          onSelect={setSelectedMint}
          acknowledged={acknowledged}
          onAcknowledge={setAcknowledged}
        />
      </section>

      {phase.kind === "done" && phase.result.status === "Success" && selected && (
        <Toast tone="success" onClose={closeToast}>
          Bought {fromBaseUnits(phase.result.totalOutputAmount ?? "0", selected.decimals)}{" "}
          {selected.tokenSymbol}.{" "}
          {phase.result.signature && (
            <a
              href={`https://solscan.io/tx/${phase.result.signature}`}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              View transaction
              <Icon name="external-link" className="ml-1 inline size-[0.9em] align-[-0.1em]" />
            </a>
          )}
        </Toast>
      )}
      {phase.kind === "done" && phase.result.status === "Failed" && (
        <Toast tone="error" onClose={closeToast}>
          {phase.result.message ?? "The swap failed."}{" "}
          {phase.result.signature && (
            <a
              href={`https://solscan.io/tx/${phase.result.signature}`}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4"
            >
              View transaction
              <Icon name="external-link" className="ml-1 inline size-[0.9em] align-[-0.1em]" />
            </a>
          )}
        </Toast>
      )}
      {phase.kind === "error" && (
        <Toast tone="error" onClose={closeToast}>
          {phase.message}
        </Toast>
      )}
    </>
  );
}
