"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { authedFetch, errorOf } from "@/lib/client";
import type { BuyerType, Country, Profile } from "@/lib/types";

/**
 * "Searching as …": the buyer's own declaration of country and buyer type.
 * Nothing here is detected. With no profile yet, the country starts blank and
 * the app shows no verdicts until one is chosen.
 */
export function ProfileBar({ countries, profile, onSaved }: { countries: Country[]; profile: Profile | null; onSaved?: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [country, setCountry] = useState(profile?.country ?? "");
  const [who, setWho] = useState<BuyerType>(profile?.who ?? "citizen");

  function save(next: { country: string; who: BuyerType }) {
    setCountry(next.country);
    setWho(next.who);
    // During onboarding nothing is saved until a country is chosen; the buyer type alone is not a profile.
    if (!next.country) return;
    setError(null);
    start(async () => {
      const res = await authedFetch("/api/profile", { method: "POST", body: JSON.stringify(next) });
      if (!res.ok) return setError(await errorOf(res, "Couldn't save that."));
      if (onSaved) router.push(onSaved);
      else router.refresh();
    });
  }

  const seg = (value: BuyerType, label: string) => (
    <button
      type="button"
      aria-pressed={who === value}
      onClick={() => save({ country, who: value })}
      className={`min-h-10 rounded-full px-4 text-[15px] font-semibold ${who === value ? "bg-ink text-white" : "text-ink"}`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-wrap items-center justify-center gap-2.5 text-[15px]">
        <span className="text-muted">Searching as</span>
        <label htmlFor="country" className="sr-only">Your country</label>
        <select
          id="country"
          value={country}
          onChange={e => save({ country: e.target.value, who })}
          className="min-h-11 rounded-full border-[1.5px] border-field bg-surface px-3.5"
        >
          <option value="" disabled>Choose your country</option>
          {countries.map(c => (
            <option key={c.code} value={c.code}>{c.flag} {c.name}</option>
          ))}
        </select>
        <div role="group" aria-label="Buyer type" className="flex gap-1 rounded-full bg-tint p-1">
          {seg("citizen", "Citizen")}
          {seg("foreigner", "Foreigner")}
        </div>
        {pending && <span className="text-sm text-muted" role="status">Saving…</span>}
      </div>
      <p className="text-[13px] text-muted">You choose this; we never detect it. Saved to your account, change it any time.</p>
      {error && <p className="text-sm text-cannot" role="alert">{error}</p>}
    </div>
  );
}
