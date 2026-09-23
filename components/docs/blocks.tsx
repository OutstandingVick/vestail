import type { ReactNode } from "react";

import { Icon } from "@/components/icons";
import { DOCS_SECTIONS } from "@/lib/docs/sections";

/**
 * The docs page's building blocks.
 *
 * Deliberately a small set. Everything on the page is one of these, so the
 * rhythm stays even and a new section cannot invent its own type scale.
 */

/**
 * A numbered section with its heading and anchor. The title comes from the
 * shared section list, so the heading and the sidebar entry are the same
 * string by construction.
 */
export function Section({ id, children }: { id: string; children: ReactNode }) {
  const section = DOCS_SECTIONS.find((s) => s.id === id);
  if (!section) throw new Error(`docs section "${id}" is not in DOCS_SECTIONS`);

  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="scroll-mt-24 border-t border-white/10 pt-12 first:border-0 first:pt-0"
    >
      <h2
        id={`${id}-heading`}
        className="group flex items-baseline gap-2 text-2xl font-bold tracking-tight text-white sm:text-3xl"
      >
        {section.title}
        <a
          href={`#${id}`}
          aria-label={`Link to ${section.title}`}
          className="text-brand-orange opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Icon name="hash" className="size-[0.6em]" />
        </a>
      </h2>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

/** The opening line of a section, a step up in size from body text. */
export function Lede({ children }: { children: ReactNode }) {
  return <p className="text-lg leading-relaxed text-white/85">{children}</p>;
}

/** Body text. */
export function P({ children }: { children: ReactNode }) {
  return <p className="leading-relaxed text-white/70">{children}</p>;
}

/** A raised panel: tables, examples, anything that is not running text. */
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-brand-navy/60 p-5 ring-1 ring-white/10 ${className}`}
    >
      {children}
    </div>
  );
}

/** An aside the reader should not skip. Orange rule, never a verdict colour. */
export function Note({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="rounded-r-xl border-l-2 border-brand-orange bg-white/[0.04] py-4 pl-5 pr-4">
      <p className="text-sm font-bold uppercase tracking-widest text-brand-orange">
        {title}
      </p>
      <div className="mt-2 leading-relaxed text-white/80">{children}</div>
    </aside>
  );
}

/** An outbound link, always marked as leaving the page. */
export function Out({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-semibold text-brand-orange underline decoration-brand-orange/40 underline-offset-4 hover:decoration-brand-orange"
    >
      {children}
      {/* Says the link leaves the page, which the wording alone does not. */}
      <Icon name="external-link" className="ml-1 inline size-[0.8em] align-[-0.05em] no-underline" />
    </a>
  );
}
