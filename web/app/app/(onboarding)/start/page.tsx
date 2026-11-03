import { redirect } from "next/navigation";

import { GiantSearch } from "@/components/GiantSearch";
import { ProfileBar } from "@/components/ProfileBar";
import { api } from "@/lib/server/api";
import { readProfile } from "@/lib/server/profile";

/**
 * Shown once, to a newly signed-up user: the giant search and the one thing
 * Vestail needs from them, their declared country and buyer type. Once that is
 * set they land on their portfolio from then on.
 *
 * The search posts back here rather than to /app/discover/buy, and that is the
 * whole point of this page's shape.
 *
 * Discover lives under (dash), whose layout redirects to /app/start when there
 * is no profile — and on this page there is never a profile, because having one
 * is what sends you somewhere else. So a new user who typed a company name and
 * pressed the button navigated away and was bounced straight back with the
 * query discarded. The first person outside the team to try it reported it as
 * "clicking See where only refreshes the page and nothing happens", which is
 * precisely what it did.
 *
 * Posting back keeps what they typed, so choosing a country afterwards takes
 * them to the answer they already asked for instead of a generic portfolio.
 */
export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (await readProfile()) redirect("/app/portfolio");

  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const countries = await api.countries();

  // Where the profile save should land them: the thing they asked for, if they
  // asked for anything.
  const next = query ? `/app/discover/buy?q=${encodeURIComponent(query)}` : "/app/portfolio";

  return (
    <section className="flex min-h-[78vh] flex-col items-center justify-center gap-8 py-12 text-center">
      <GiantSearch q={query} action="/app/start" />
      <div className="flex flex-col items-center gap-3 rounded-panel bg-surface px-6 py-5">
        <p className="font-semibold">
          {query
            ? `Nearly — rules differ by country. Where are you buying ${query} from?`
            : "First, where are you buying from?"}
        </p>
        <ProfileBar countries={countries} profile={null} onSaved={next} />
      </div>
    </section>
  );
}
