import { notFound, redirect } from "next/navigation";

import AssetPage from "../../asset/[id]/page";
import { api } from "@/lib/server/api";
import { readProfile } from "@/lib/server/profile";

export default async function NamedAssetPage({ params, searchParams }: {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ buy?: string }>;
}) {
  const { name } = await params;
  const { buy } = await searchParams;
  const wanted = name.trim().toLowerCase();
  const [profile, symbols] = await Promise.all([readProfile(), api.tokenSymbols()]);
  const match = symbols.find(item => item.name.toLowerCase() === wanted || item.symbol.toLowerCase() === wanted);
  if (!match) notFound();
  if (!profile) redirect("/app/start");

  const board = await api.tokens(match.symbol, profile.country, profile.who);
  return (
    <AssetPage
      params={Promise.resolve({ id: board.asset })}
      searchParams={Promise.resolve({ symbol: match.symbol, canonical: "1", buy })}
    />
  );
}
