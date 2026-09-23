"use client";

import { useMemo } from "react";

import { DOCS_SECTIONS, docsGroups } from "@/lib/docs/sections";

import { useActiveSection } from "./useActiveSection";

/**
 * "On this page", from `lg` up. Below that the page is a single column and
 * the compact contents card at the top of the page does this job instead.
 *
 * The highlight is aria-current="location", not colour alone, so the
 * position is announced rather than only shown.
 */
export function DocsSidebar() {
  const ids = useMemo(() => DOCS_SECTIONS.map((s) => s.id), []);
  const active = useActiveSection(ids);

  return (
    <nav
      aria-label="On this page"
      className="sticky top-24 hidden h-fit w-60 shrink-0 self-start py-16 lg:block"
    >
      {docsGroups().map(({ group, sections }) => (
        <div key={group} className="mb-6">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-white/40">
            {group}
          </p>
          <ul className="space-y-0.5 border-l border-white/10">
            {sections.map((section) => {
              const current = section.id === active;
              return (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    aria-current={current ? "location" : undefined}
                    className={`-ml-px block border-l py-1.5 pl-3 text-sm transition-colors ${
                      current
                        ? "border-brand-orange font-semibold text-white"
                        : "border-transparent text-white/60 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    {section.title}
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
