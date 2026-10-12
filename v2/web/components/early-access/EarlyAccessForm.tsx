"use client";

import { useState } from "react";

import { ChoiceChips } from "@/components/early-access/ChoiceChips";
import { CountryField } from "@/components/early-access/CountryField";
import { TextField } from "@/components/early-access/TextField";
import { WelcomeMessage } from "@/components/early-access/WelcomeMessage";
import { CITIZENSHIP_OPTIONS, OWNERSHIP_INTERESTS } from "@/lib/early-access";
import { earlyAccessSchema } from "@/lib/early-access-schema";

type Errors = Record<string, string>;
const initial = { firstName: "", email: "", country: "", otherCountry: "", citizenship: "", interests: [] as string[], blockedPurchase: "", website: "" };

export function EarlyAccessForm() {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [welcome, setWelcome] = useState<{ firstName: string; country: string } | null>(null);
  const set = (key: keyof typeof form, value: string | string[]) => { setForm(current => ({ ...current, [key]: value })); setErrors(current => ({ ...current, [key]: "" })); };

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const country = form.country === "Somewhere else" ? form.otherCountry : form.country;
    const payload = { ...form, country, otherCountry: undefined };
    const parsed = earlyAccessSchema.safeParse(payload);
    if (!parsed.success) { const fields = parsed.error.flatten().fieldErrors; setErrors(Object.fromEntries(Object.entries(fields).map(([key, messages]) => [key, messages?.[0] ?? "Check this field."]))); return; }
    setSubmitting(true); setErrors({});
    try {
      const response = await fetch("/api/early-access", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsed.data) });
      const body = await response.json().catch(() => null);
      if (!response.ok) { setErrors({ ...(body?.fields ? Object.fromEntries(Object.entries(body.fields).map(([key, messages]) => [key, (messages as string[])?.[0]])) : {}), form: body?.error ?? "Please try again." }); return; }
      setWelcome({ firstName: parsed.data.firstName, country: parsed.data.country });
    } catch { setErrors({ form: "We couldn't reach Vestail. Check your connection and try again." }); }
    finally { setSubmitting(false); }
  }

  if (welcome) return <WelcomeMessage {...welcome} />;
  return <form onSubmit={submit} noValidate className="rounded-panel border border-line bg-surface/90 p-6 shadow-[0_30px_80px_-30px_rgba(124,92,255,0.35)] backdrop-blur sm:p-8"><div className="space-y-6"><TextField label="First name" name="firstName" value={form.firstName} error={errors.firstName} required autoComplete="given-name" onChange={value => set("firstName", value)} /><TextField label="Email" name="email" type="email" value={form.email} error={errors.email} required autoComplete="email" onChange={value => set("email", value)} /><CountryField value={form.country} other={form.otherCountry} error={errors.country} onChange={value => set("country", value)} onOtherChange={value => set("otherCountry", value)} /><ChoiceChips legend="Are you a citizen of that country?" options={CITIZENSHIP_OPTIONS} selected={form.citizenship ? [form.citizenship] : []} error={errors.citizenship} onToggle={option => set("citizenship", option)} /><ChoiceChips legend="What would you like to own?" options={OWNERSHIP_INTERESTS} selected={form.interests} multiple error={errors.interests} onToggle={option => set("interests", form.interests.includes(option) ? form.interests.filter(item => item !== option) : [...form.interests, option])} /><div><label htmlFor="blocked-purchase" className="block text-sm font-semibold">Anything you&apos;ve tried to buy and couldn&apos;t? <span className="font-normal text-muted">Optional</span></label><textarea id="blocked-purchase" name="blockedPurchase" value={form.blockedPurchase} maxLength={500} rows={3} onChange={event => set("blockedPurchase", event.target.value)} className="mt-2 w-full resize-y rounded-field border-[1.5px] border-field bg-wash p-4 text-base outline-none focus:border-ink focus:ring-2 focus:ring-ink/15" /></div><div className="absolute -left-[10000px]" aria-hidden="true"><label htmlFor="website">Website</label><input id="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={event => set("website", event.target.value)} /></div>{errors.form && <p role="alert" className="rounded-field border border-cannot px-4 py-3 text-sm text-cannot">{errors.form}</p>}<button type="submit" disabled={submitting} className="min-h-13 w-full rounded-full bg-action px-5 font-bold text-on-action outline-none transition-transform duration-150 active:scale-[.96] focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-65">{submitting ? "Saving your place…" : "Get early access"}</button><p className="text-center text-xs leading-5 text-muted">We&apos;ll only email you about Vestail access. Unsubscribe anytime.</p></div></form>;
}
