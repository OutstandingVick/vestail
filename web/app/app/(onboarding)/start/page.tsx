import { redirect } from "next/navigation";

import { GiantSearch } from "@/components/GiantSearch";
import { ProfileBar } from "@/components/ProfileBar";
import { api } from "@/lib/server/api";
import { readProfile } from "@/lib/server/profile";

export default async function StartPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  if (await readProfile()) redirect("/app/portfolio");

  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const countries = await api.countries();

  // Preserve the query while the buyer creates the profile required by Discover.
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
