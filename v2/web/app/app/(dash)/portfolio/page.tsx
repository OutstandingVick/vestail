import { Dashboard } from "@/components/Dashboard";
import { api } from "@/lib/server/api";
import { readProfile } from "@/lib/server/profile";

export default async function PortfolioPage() {
  const [profile, assets, countries] = await Promise.all([readProfile(), api.assets(), api.countries()]);
  const country = countries.find(c => c.code === profile?.country);
  return <Dashboard assets={assets} countryName={country?.name ?? profile?.country ?? ""} who={profile?.who ?? "citizen"} />;
}
