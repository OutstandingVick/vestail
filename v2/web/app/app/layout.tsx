import { AppGate } from "@/components/AppGate";
import { readProfile } from "@/lib/server/profile";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  return <AppGate profile={await readProfile()}>{children}</AppGate>;
}
