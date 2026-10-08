"use client";

import { usePrivy } from "@privy-io/react-auth";

import { Avatar } from "@/components/Avatar";
import { accountOf } from "@/lib/account";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Country, Profile } from "@/lib/types";

const NAV = [
  { href: "/app/search", label: "Search", icon: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-3.5-3.5" },
  { href: "/app", label: "Portfolio", icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" },
  { href: "/app/compare", label: "Compare", icon: "M4 19V9M10 19V5M16 19v-7M22 19H2" },
];

function Icon({ d }: { d: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

/**
 * The dashboard's frame: navigation, the buyer's declared country (always
 * visible, always changeable), the theme, and who is signed in. On a phone it
 * sits above the page as a wrapped bar.
 */
export function Sidebar({ profile, country }: { profile: Profile; country: Country | null }) {
  const path = usePathname();
  const router = useRouter();
  const { user, logout } = usePrivy();
  const account = accountOf(user);
  const active = (href: string) => (href === "/app" ? path === "/app" : path.startsWith(href));

  async function signOut() {
    await fetch("/api/profile", { method: "DELETE" });
    await logout();
    router.replace("/");
  }

  return (
    <aside className="flex w-full flex-col gap-4 rounded-panel bg-surface p-4 md:sticky md:top-4 md:h-[calc(100vh-2rem)] md:w-[248px] md:shrink-0">
      <div className="flex items-center justify-between">
        <Link href="/app" aria-label="Vestail home"><Logo className="h-6 w-auto" /></Link>
        <ThemeToggle />
      </div>

      <Link href="/app/settings" className="flex items-center gap-3 rounded-card bg-wash px-3 py-2.5 hover:bg-tint">
        <span className="text-2xl" aria-hidden="true">{country?.flag}</span>
        <span className="flex min-w-0 flex-col">
          <strong className="truncate text-sm">{country?.name ?? profile.country}</strong>
          <span className="text-xs text-muted capitalize">{profile.who} · change</span>
        </span>
      </Link>

      <nav aria-label="App" className="flex flex-row flex-wrap gap-1 md:flex-col">
        {NAV.map(n => (
          <Link key={n.href} href={n.href} aria-current={active(n.href) ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] ${active(n.href) ? "bg-tint font-semibold" : "text-muted hover:bg-wash hover:text-ink"}`}>
            <Icon d={n.icon} />{n.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-2 border-t border-line pt-3">
        <Link href="/app/settings" aria-current={path === "/app/settings" ? "page" : undefined}
          className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] ${path === "/app/settings" ? "bg-tint font-semibold" : "text-muted hover:bg-wash hover:text-ink"}`}>
          <Icon d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 7 19.4l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1A1.7 1.7 0 0 0 3 13.7H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 7l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1A1.7 1.7 0 0 0 10.3 3V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />Settings
        </Link>
        <div className="flex items-center justify-between gap-2 rounded-xl bg-wash py-1.5 pr-1.5 pl-1.5 text-sm">
          <Link href="/app/settings" className="flex min-w-0 items-center gap-2">
            <Avatar label={account.label} color={account.avatar} size={30} />
            <span className="truncate font-semibold">{account.label}</span>
          </Link>
          <button type="button" onClick={signOut} className="min-h-8 shrink-0 rounded-full bg-surface px-3 text-[13px]">Sign out</button>
        </div>
      </div>
    </aside>
  );
}
