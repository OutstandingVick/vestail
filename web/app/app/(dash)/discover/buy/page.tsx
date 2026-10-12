import { redirect } from "next/navigation";

import type { DiscoverPageProps } from "@/components/DiscoverPageContent";
import { api } from "@/lib/server/api";
import { readProfile } from "@/lib/server/profile";
import { symbolsFor } from "@/lib/tokens";

export default async function BuyPage({ searchParams }: DiscoverPageProps) {
  const { q } = await searchParams;
  const query = q?.trim();
  if (!query) redirect("/app/discover");

  const profile = await readProfile();
  if (!profile) redirect("/app/start");
  const [hit, tokenSymbols] = await Promise.all([
    api.matrix({ q: query, who: profile.who, countries: profile.country }),
    api.tokenSymbols(),
  ]);
  const asset = hit.rows[0]?.cells[0]?.asset;
  if (!asset) redirect(`/app/discover?q=${encodeURIComponent(query)}`);
  const match = symbolsFor(query, hit.resolution, tokenSymbols)[0];
  const name = match?.name ?? hit.resolution.entity?.name ?? query;
  redirect(`/app/discover/${asset}/${encodeURIComponent(name)}`);
}
