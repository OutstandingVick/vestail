"use client";

import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Logo } from "@/components/Logo";

/** Who is signed in, shortened: their email, else their wallet. */
function who(user: ReturnType<typeof usePrivy>["user"]): string {
  if (user?.email?.address) return user.email.address;
  const w = user?.wallet?.address;
  return w ? `${w.slice(0, 4)}…${w.slice(-4)}` : "Signed in";
}

export function AppNav() {
  const { user, logout } = usePrivy();
  const router = useRouter();
  const path = usePathname();
  const link = (href: string, label: string) => (
    <Link href={href} className={path === href ? "font-semibold text-ink" : "text-muted hover:text-ink"} aria-current={path === href ? "page" : undefined}>
      {label}
    </Link>
  );

  async function signOut() {
    await fetch("/api/profile", { method: "DELETE" });
    await logout();
    router.replace("/");
  }

  return (
    <header className="sticky top-0 z-10 border-b border-line bg-page/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/app" aria-label="Vestail home"><Logo /></Link>
        <nav className="flex grow gap-5 text-[15px]">
          {link("/app", "Search")}
          {link("/app/compare", "Compare")}
        </nav>
        <span className="flex items-center gap-2 rounded-full border border-line bg-surface py-1.5 pr-1.5 pl-3.5 text-sm">
          <span className="max-w-[180px] truncate">{who(user)}</span>
          <button type="button" onClick={signOut} className="min-h-8 rounded-full bg-tint px-3 text-[13px]">Sign out</button>
        </span>
      </div>
    </header>
  );
}
