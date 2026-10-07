import { AppGate } from "@/components/AppGate";
import { AppNav } from "@/components/AppNav";
import { readProfile } from "@/lib/server/profile";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await readProfile();
  return (
    <AppGate profile={profile}>
      <AppNav />
      <main className="mx-auto flex max-w-[1180px] flex-col gap-12 px-4 pb-20">{children}</main>
    </AppGate>
  );
}
