"use client";

import { useState } from "react";

type Errors = Record<string, string>;
const initial = { xHandle: "", email: "", country: "", relationship: "", wallet: "", experience: "", reason: "", telegram: "", website: "" };

export function TesterApplicationForm() {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  const set = (key: keyof typeof form, value: string) => { setForm(current => ({ ...current, [key]: value })); setErrors(current => ({ ...current, [key]: "" })); };

  return <form noValidate className="rounded-panel border border-line bg-surface/90 p-6 shadow-[0_30px_80px_-30px_rgba(124,92,255,0.35)] backdrop-blur sm:p-8"><div className="space-y-6"><button type="submit" disabled={submitting || complete} className="min-h-13 w-full rounded-full bg-action px-5 font-bold text-on-action disabled:opacity-65">Apply to test Vestail</button></div></form>;
}
