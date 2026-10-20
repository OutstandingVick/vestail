"use client";

import { useId } from "react";

import { EARLY_ACCESS_COUNTRIES } from "@/lib/early-access";

export function CountryField({ value, other, error, allowOther = true, onChange, onOtherChange }: { value: string; other: string; error?: string; allowOther?: boolean; onChange: (value: string) => void; onOtherChange: (value: string) => void }) {
  const id = useId();
  return <fieldset><label htmlFor={id} className="block text-sm font-semibold">Country you live in</label><input id={id} name="country" list={`${id}-options`} value={value} onChange={event => onChange(event.target.value)} placeholder="Start typing a country" autoComplete="country-name" aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} className="mt-2 min-h-12 w-full rounded-field border-[1.5px] border-field bg-wash px-4 text-base outline-none focus:border-ink focus:ring-2 focus:ring-ink/15" /><datalist id={`${id}-options`}>{EARLY_ACCESS_COUNTRIES.map(([, name]) => <option key={name} value={name} />)}{allowOther && <option value="Somewhere else" />}</datalist>{allowOther && value === "Somewhere else" && <div className="mt-3"><label htmlFor={`${id}-other`} className="sr-only">Enter your country</label><input id={`${id}-other`} name="otherCountry" value={other} onChange={event => onOtherChange(event.target.value)} placeholder="Enter your country" autoComplete="country-name" className="min-h-12 w-full rounded-field border-[1.5px] border-field bg-wash px-4 text-base outline-none focus:border-ink focus:ring-2 focus:ring-ink/15" /></div>}{error && <p id={`${id}-error`} className="mt-2 text-sm text-cannot">{error}</p>}</fieldset>;
}
