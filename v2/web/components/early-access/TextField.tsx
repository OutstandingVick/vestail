"use client";

import { useId } from "react";

export function TextField({ label, name, type = "text", value, error, required, autoComplete, onChange }: { label: string; name: string; type?: string; value: string; error?: string; required?: boolean; autoComplete?: string; onChange: (value: string) => void }) {
  const id = useId();
  return <div><label htmlFor={id} className="block text-sm font-semibold">{label}{required && <span aria-hidden="true"> *</span>}</label><input id={id} name={name} type={type} value={value} required={required} autoComplete={autoComplete} onChange={event => onChange(event.target.value)} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} className="mt-2 min-h-12 w-full rounded-field border-[1.5px] border-field bg-wash px-4 text-base outline-none focus:border-ink focus:ring-2 focus:ring-ink/15" />{error && <p id={`${id}-error`} className="mt-2 text-sm text-cannot">{error}</p>}</div>;
}
