import { AppGate } from "@/components/AppGate";
import { AppNav } from "@/components/AppNav";
import { readProfile } from "@/lib/server/profile";

/** First visit only: a bare top bar, no dashboard chrome yet. */
export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppGate profile={await readProfile()}>
      <AppNav />
      <main className="mx-auto flex max-w-[1180px] flex-col gap-12 px-4 pb-20">{children}</main>
    </AppGate>
  );
}
