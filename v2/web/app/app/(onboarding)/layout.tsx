import { AppNav } from "@/components/AppNav";

/** First visit only: a bare top bar, no dashboard chrome yet. */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppNav />
      <main className="mx-auto flex max-w-[1180px] flex-col gap-12 px-4 pb-20">{children}</main>
    </>
  );
}
