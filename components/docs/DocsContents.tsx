import { docsGroups } from "@/lib/docs/sections";

/**
 * The contents, for the widths where the sidebar is hidden.
 *
 * Collapsed by default: on a phone the first screen should be the argument,
 * not fourteen links. A <details> rather than a menu, so it works before any
 * JavaScript arrives and needs no state of its own.
 */
export function DocsContents() {
  return (
    <details className="group rounded-2xl bg-brand-navy/60 ring-1 ring-white/10 lg:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-orange">
        On this page
        <span
          aria-hidden
          className="text-brand-orange transition-transform group-open:rotate-45 motion-reduce:transition-none"
        >
          +
        </span>
      </summary>
      <nav aria-label="On this page" className="px-4 pb-4">
        {docsGroups().map(({ group, sections }) => (
          <div key={group} className="mt-3 first:mt-0">
            <p className="text-xs font-bold uppercase tracking-widest text-white/40">
              {group}
            </p>
            <ul className="mt-1 space-y-1">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="block py-1 text-white/70 hover:text-white"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </details>
  );
}
