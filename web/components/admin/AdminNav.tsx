"use client";

import { ChartDonut, Gauge, Heartbeat, Pulse, Ticket, UserFocus, Users } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Dashboard", icon: Gauge },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/testers", label: "Testers", icon: UserFocus },
  { href: "/admin/invites", label: "Invites", icon: Ticket },
  { href: "/admin/activity", label: "Activity", icon: Pulse },
  { href: "/admin/coverage", label: "Coverage", icon: ChartDonut },
  { href: "/admin/health", label: "Health", icon: Heartbeat },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Owner dashboard" className="flex gap-1 overflow-x-auto pb-1 [scrollbar-width:none] lg:flex-col lg:overflow-visible lg:pb-0">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`group flex min-h-11 shrink-0 items-center gap-3 rounded-field px-3.5 text-sm font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emphasis ${active ? "bg-tint text-ink shadow-[inset_0_0_0_1px_rgb(90_61_240/0.08)]" : "text-muted hover:bg-wash hover:text-ink"}`}
          >
            <span className={`grid size-8 place-items-center rounded-xl ${active ? "bg-surface text-emphasis shadow-sm" : "text-muted group-hover:text-ink"}`}>
              <Icon size={18} weight={active ? "fill" : "regular"} aria-hidden="true" />
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
