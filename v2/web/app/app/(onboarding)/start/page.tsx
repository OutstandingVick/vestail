import { redirect } from "next/navigation";

import { GiantSearch } from "@/components/GiantSearch";
import { ProfileBar } from "@/components/ProfileBar";
import { api } from "@/lib/server/api";
import { readProfile } from "@/lib/server/profile";

/**
 * Shown once, to a newly signed-up user: the giant search and the one thing
 * Vestail needs from them, their declared country and buyer type. Once that is
 * set they land on their portfolio from then on.
 */
export default async function StartPage() {
  if (await readProfile()) redirect("/app");
  const countries = await api.countries();
  return (
    <section className="flex min-h-[78vh] flex-col items-center justify-center gap-8 py-12 text-center">
      <GiantSearch q="" action="/app/search" />
      <div className="flex flex-col items-center gap-3 rounded-panel bg-surface px-6 py-5">
        <p className="font-semibold">First, where are you buying from?</p>
        <ProfileBar countries={countries} profile={null} onSaved="/app" />
      </div>
    </section>
  );
}
