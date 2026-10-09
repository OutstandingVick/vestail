"use client";

import {
  ArrowsLeftRight,
  ChartLineUp,
  ClockCounterClockwise,
  Compass,
  Gear,
  List,
  Wallet,
  X,
} from "@phosphor-icons/react";
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
  { href: "/app/search", label: "Discover", icon: Compass },
  { href: "/app/portfolio", label: "Portfolio", icon: Wallet },
  { href: "/app/markets", label: "Markets", icon: ChartLineUp },
  { href: "/app/activity", label: "Activity", icon: ClockCounterClockwise },
  { href: "/app/compare", label: "Compare", icon: ArrowsLeftRight },
];

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
            {open ? <X size={20} weight="regular" aria-hidden="true" /> : <List size={20} weight="regular" aria-hidden="true" />}
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
        {NAV.map(n => {
          const selected = active(n.href);
          const NavIcon = n.icon;
          return (
            <Link key={n.href} href={n.href} aria-current={selected ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] ${selected ? "bg-tint font-semibold" : "text-muted hover:bg-wash hover:text-ink"}`}>
              <NavIcon size={18} weight={selected ? "fill" : "regular"} aria-hidden="true" />{n.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-2 border-t border-line pt-3">
        <Link href="/app/settings" aria-current={path === "/app/settings" ? "page" : undefined}
          className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-[15px] ${path === "/app/settings" ? "bg-tint font-semibold" : "text-muted hover:bg-wash hover:text-ink"}`}>
          <Gear size={18} weight={path === "/app/settings" ? "fill" : "regular"} aria-hidden="true" />Settings
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
