import { ProfileBar } from "@/components/ProfileBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { api } from "@/lib/server/api";
import { readProfile } from "@/lib/server/profile";

export default async function SettingsPage() {
  const [profile, countries] = await Promise.all([readProfile(), api.countries()]);
  return (
    <div className="flex flex-col gap-6 pt-6">
      <h1 className="text-[32px] font-extrabold tracking-[-0.02em]">Settings</h1>
      <section className="flex flex-col items-start gap-3 rounded-panel bg-surface p-6">
        <h2 className="text-lg font-bold">Where you&apos;re buying from</h2>
        <p className="text-sm text-muted">Every verdict in Vestail is for this country and buyer type. You declare it; it changes the moment you do.</p>
        <ProfileBar countries={countries} profile={profile} />
      </section>
      <section className="flex items-center justify-between gap-3 rounded-panel bg-surface p-6">
        <div>
          <h2 className="text-lg font-bold">Appearance</h2>
          <p className="text-sm text-muted">Light or dark, remembered on this device.</p>
        </div>
        <ThemeToggle className="bg-wash" />
      </section>
    </div>
  );
}
