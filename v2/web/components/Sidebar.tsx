"use client";

import { usePrivy } from "@privy-io/react-auth";

import { Avatar } from "@/components/Avatar";
import { accountOf } from "@/lib/account";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { Country, Profile } from "@/lib/types";

const NAV = [
  { href: "/app/search", label: "Search", icon: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-3.5-3.5" },
  { href: "/app/portfolio", label: "Portfolio", icon: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" },
  { href: "/app/discover", label: "Discover", icon: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM15.5 8.5l-2 5-5 2 2-5z" },
  { href: "/app/markets", label: "Markets", icon: "M4 20V10M4 7V4M10 20v-4M10 13V5M16 20v-7M16 10V4M22 20V9M22 6V4" },
  { href: "/app/activity", label: "Activity", icon: "M12 8v5l3 2M3.5 12a8.5 8.5 0 1 0 2.5-6M3 4v5h5" },
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
  const active = (href: string) => path.startsWith(href);

  // On a phone the sidebar folds into a menu button; it closes again when
  // the page changes or Escape is pressed.
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function signOut() {
    await fetch("/api/profile", { method: "DELETE" });
    await logout();
    router.replace("/app");
  }

  return (
    <aside className="flex w-full flex-col gap-4 rounded-panel bg-surface p-4 md:sticky md:top-4 md:h-[calc(100vh-2rem)] md:w-[248px] md:shrink-0">
      <div className="flex items-center justify-between gap-2">
        <Link href="/app/portfolio" aria-label="Vestail home"><Logo className="h-6 w-auto" /></Link>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen(o => !o)}
            aria-expanded={open}
            aria-controls="app-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            className="flex size-10 items-center justify-center rounded-full hover:bg-tint md:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d={open ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"} />
            </svg>
          </button>
        </div>
      </div>

      <div id="app-menu" className={`${open ? "flex" : "hidden"} flex-col gap-4 md:flex md:flex-1`}>

      <Link href="/app/settings" className="flex items-center gap-3 rounded-card bg-wash px-3 py-2.5 hover:bg-tint">
        <span className="text-2xl" aria-hidden="true">{country?.flag}</span>
        <span className="flex min-w-0 flex-col">
          <strong className="truncate text-sm">{country?.name ?? profile.country}</strong>
          <span className="text-xs text-muted capitalize">{profile.who} · change</span>
        </span>
      </Link>

      <nav aria-label="App" className="flex flex-col gap-1">
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
            <Avatar label={account.label} color={account.avatar} imageUrl={account.avatarUrl} size={30} />
            <span className="truncate font-semibold">{account.label}</span>
          </Link>
          <button type="button" onClick={signOut} className="min-h-8 shrink-0 rounded-full bg-surface px-3 text-[13px]">Sign out</button>
        </div>
      </div>
      </div>
    </aside>
  );
}
