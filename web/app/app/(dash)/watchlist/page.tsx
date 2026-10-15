import { WatchlistPage } from "@/components/WatchlistPage";
import { api } from "@/lib/server/api";
import { readProfile } from "@/lib/server/profile";

export default async function WatchlistRoute() {
  const profile = (await readProfile())!;
  const country = (await api.countries()).find(item => item.code === profile.country);
  return <WatchlistPage countryName={country?.name ?? profile.country} />;
}
