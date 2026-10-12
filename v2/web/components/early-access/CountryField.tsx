"use client";

import { useId } from "react";

import { EARLY_ACCESS_COUNTRIES } from "@/lib/early-access";

export function CountryField({ value, other, error, onChange, onOtherChange }: { value: string; other: string; error?: string; onChange: (value: string) => void; onOtherChange: (value: string) => void }) {
  const id = useId();
  return <fieldset><label htmlFor={id} className="block text-sm font-semibold">Country you live in</label><input id={id} list={`${id}-options`} value={value} onChange={event => onChange(event.target.value)} placeholder="Start typing a country" autoComplete="country-name" aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} className="mt-2 min-h-12 w-full rounded-2xl border border-[#cbc9df] bg-white px-4 outline-none focus:border-[#17171A] focus:ring-2 focus:ring-[#17171A]/15" /><datalist id={`${id}-options`}>{EARLY_ACCESS_COUNTRIES.map(([, name]) => <option key={name} value={name} />)}<option value="Somewhere else" /></datalist>{value === "Somewhere else" && <div className="mt-3"><label htmlFor={`${id}-other`} className="sr-only">Enter your country</label><input id={`${id}-other`} value={other} onChange={event => onOtherChange(event.target.value)} placeholder="Enter your country" autoComplete="country-name" className="min-h-12 w-full rounded-2xl border border-[#cbc9df] bg-white px-4 outline-none focus:border-[#17171A] focus:ring-2 focus:ring-[#17171A]/15" /></div>}{error && <p id={`${id}-error`} className="mt-2 text-sm text-[#9f321d]">{error}</p>}</fieldset>;
}
