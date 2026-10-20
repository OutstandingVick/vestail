"use client";

import { ChartDonut, Gauge, Heartbeat, Pulse, Ticket, UserFocus, Users } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Overview", icon: Gauge },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/testers", label: "Testers", icon: UserFocus },
  { href: "/admin/invites", label: "Invites", icon: Ticket },
  { href: "/admin/activity", label: "Activity", icon: Pulse },
  { href: "/admin/coverage", label: "Coverage", icon: ChartDonut },
  { href: "/admin/health", label: "Health", icon: Heartbeat },
];

export function AdminNav() {
  const pathname = usePathname();
  return <nav aria-label="Owner dashboard" className="flex gap-1 overflow-x-auto lg:flex-col">{items.map(({ href, label, icon: Icon }) => {
    const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
    return <Link key={href} href={href} aria-current={active ? "page" : undefined} className={`flex min-h-11 shrink-0 items-center gap-3 rounded-field px-3.5 text-sm font-semibold ${active ? "bg-ink-strong text-on-ink" : "text-muted hover:bg-wash hover:text-ink"}`}><Icon size={19} weight={active ? "fill" : "regular"} aria-hidden="true" />{label}</Link>;
  })}</nav>;
}
