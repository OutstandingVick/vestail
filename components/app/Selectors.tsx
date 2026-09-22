"use client";

import {
  REGION_ALLOWLIST,
  REGION_FLAG,
  REGION_NAME,
  SYMBOL_ALLOWLIST,
  SYMBOL_NAME,
  type AllowedRegion,
  type AllowedSymbol,
} from "@/lib/constants";
import { monogram } from "@/lib/labels";

import { Combobox } from "./Combobox";

/** Round ticker badge: two-letter monogram, never a company logo. */
export function Monogram({ symbol, size = "md" }: { symbol: string; size?: "sm" | "md" }) {
  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-violet to-brand-navy font-bold text-white ring-1 ring-brand-orange/70 ${
        size === "sm" ? "size-7 text-[10px]" : "size-9 text-xs"
      }`}
    >
      {monogram(symbol)}
    </span>
  );
}

function Country({ region }: { region: AllowedRegion }) {
  return (
    <span className="flex items-center gap-3">
      <span aria-hidden className="text-2xl leading-none">
        {REGION_FLAG[region]}
      </span>
      <span>{REGION_NAME[region]}</span>
    </span>
  );
}

function Stock({ symbol }: { symbol: AllowedSymbol }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <Monogram symbol={symbol} />
      <span className="truncate">
        {symbol} <span className="font-normal text-white/60">· {SYMBOL_NAME[symbol]}</span>
      </span>
    </span>
  );
}

/** "Where are you?" Self-declared; nothing is checked or blocked. */
export function CountrySelect({
  value,
  onChange,
}: {
  value: AllowedRegion | null;
  onChange: (region: AllowedRegion) => void;
}) {
  return (
    <div>
      <Combobox
        label="Where are you?"
        placeholder="Choose your country"
        searchPlaceholder="Search countries"
        value={value}
        onChange={onChange}
        renderValue={(r) => <Country region={r} />}
        options={REGION_ALLOWLIST.map((r) => ({
          value: r,
          searchText: `${REGION_NAME[r]} ${r}`,
          row: <Country region={r} />,
        }))}
      />
      <p className="mt-2 text-xs text-white/60">
        Self-declared. We use this to show which versions you can hold.
      </p>
    </div>
  );
}

/** "Which stock?" Every symbol Vestail resolves. */
export function StockSelect({
  value,
  onChange,
}: {
  value: AllowedSymbol | null;
  onChange: (symbol: AllowedSymbol) => void;
}) {
  return (
    <Combobox
      label="Which stock?"
      placeholder="Choose a stock"
      searchPlaceholder="Search by ticker or name"
      value={value}
      onChange={onChange}
      renderValue={(s) => <Stock symbol={s} />}
      options={SYMBOL_ALLOWLIST.map((s) => ({
        value: s,
        searchText: `${s} ${SYMBOL_NAME[s]}`,
        row: <Stock symbol={s} />,
      }))}
    />
  );
}
