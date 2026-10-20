"use client";

import { useState } from "react";
import { TextField } from "@/components/early-access/TextField";
import { CountryField } from "@/components/early-access/CountryField";
import { ChoiceChips } from "@/components/early-access/ChoiceChips";
import { CRYPTO_EXPERIENCE, TESTER_RELATIONSHIPS } from "@/lib/testers";

type Errors = Record<string, string>;
const initial = { xHandle: "", email: "", country: "", relationship: "", wallet: "", experience: "", reason: "", telegram: "", website: "" };

export function TesterApplicationForm() {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  const set = (key: keyof typeof form, value: string) => { setForm(current => ({ ...current, [key]: value })); setErrors(current => ({ ...current, [key]: "" })); };

  return <form noValidate className="rounded-panel border border-line bg-surface/90 p-6 shadow-[0_30px_80px_-30px_rgba(124,92,255,0.35)] backdrop-blur sm:p-8"><div className="space-y-6"><TextField label="X handle" name="xHandle" value={form.xHandle} error={errors.xHandle} required autoComplete="off" onChange={value => set("xHandle", value)} /><TextField label="Email" name="email" type="email" value={form.email} error={errors.email} required autoComplete="email" onChange={value => set("email", value)} /><CountryField value={form.country} other="" error={errors.country} allowOther={false} onChange={value => set("country", value)} onOtherChange={() => undefined} /><ChoiceChips legend="Citizen or foreigner?" options={TESTER_RELATIONSHIPS} selected={form.relationship ? [form.relationship] : []} error={errors.relationship} onToggle={value => set("relationship", value)} /><TextField label="Solana wallet address" name="wallet" value={form.wallet} error={errors.wallet} required autoComplete="off" onChange={value => set("wallet", value)} /><ChoiceChips legend="Crypto experience" options={CRYPTO_EXPERIENCE} selected={form.experience ? [form.experience] : []} error={errors.experience} onToggle={value => set("experience", value)} /><div><label htmlFor="tester-reason" className="block text-sm font-semibold">Why do you want to test? <span className="font-normal text-muted">Optional</span></label><textarea id="tester-reason" name="reason" value={form.reason} maxLength={280} rows={3} onChange={event => set("reason", event.target.value)} aria-invalid={!!errors.reason} className="mt-2 w-full resize-y rounded-field border-[1.5px] border-field bg-wash p-4 text-base outline-none focus:border-ink focus:ring-2 focus:ring-ink/15" />{errors.reason && <p className="mt-2 text-sm text-cannot">{errors.reason}</p>}</div><TextField label="Telegram username" name="telegram" value={form.telegram} error={errors.telegram} required autoComplete="off" onChange={value => set("telegram", value)} /><div className="absolute -left-[10000px]" aria-hidden="true"><label htmlFor="tester-website">Website</label><input id="tester-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={event => set("website", event.target.value)} /></div><button type="submit" disabled={submitting || complete} className="min-h-13 w-full rounded-full bg-action px-5 font-bold text-on-action disabled:opacity-65">Apply to test Vestail</button></div></form>;
}
