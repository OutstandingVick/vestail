import { redirect } from "next/navigation";

import { Sidebar } from "@/components/Sidebar";
import { api } from "@/lib/server/api";
import { readProfile } from "@/lib/server/profile";

/** The signed-in app: a sidebar and the page. No declared country yet means onboarding first. */
export default async function DashLayout({ children }: { children: React.ReactNode }) {
  const profile = await readProfile();
  if (!profile) redirect("/app/start");
  const country = (await api.countries()).find(c => c.code === profile.country);
  return (
    <div className="flex flex-wrap gap-4 p-3 sm:p-4">
      <Sidebar profile={profile} country={country ?? null} />
      <main className="flex min-w-0 flex-[999_1_640px] flex-col gap-8 px-1 pb-16 sm:px-6">{children}</main>
    </div>
  );
}
