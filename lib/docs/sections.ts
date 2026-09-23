/**
 * The docs page's table of contents.
 *
 * One list, used three times: to render the sidebar, to drive the
 * scroll-spy, and to title each section. Keeping it here means a heading and
 * its nav entry can never drift apart, and the order of the page is
 * reviewable as data.
 */
export interface DocsSection {
  /** The anchor, e.g. #verdicts. */
  id: string;
  /** The heading, and the sidebar label. */
  title: string;
  /** Sidebar grouping. */
  group: DocsGroup;
}

export type DocsGroup = "Start here" | "The model" | "Under the hood" | "Reference";

export const DOCS_SECTIONS: readonly DocsSection[] = [
  { id: "overview", title: "What Vestail is", group: "Start here" },
  { id: "problem", title: "A ticker is not one thing", group: "Start here" },
  { id: "stakes", title: "Why this costs you money", group: "Start here" },

  { id: "verdicts", title: "Three verdicts, not two", group: "The model" },
  { id: "disclosure", title: "Disclosure, not enforcement", group: "The model" },
  { id: "routing", title: "What Vestail will route", group: "The model" },

  { id: "how-it-works", title: "How it works", group: "Under the hood" },
  { id: "policies", title: "Where the rules come from", group: "Under the hood" },
  { id: "registry", title: "How we know a mint is real", group: "Under the hood" },
  { id: "custody", title: "Your funds and your keys", group: "Under the hood" },

  { id: "findings", title: "What the research found", group: "Reference" },
  { id: "faq", title: "Questions", group: "Reference" },
  { id: "limits", title: "What Vestail is not", group: "Reference" },
  { id: "start", title: "Get started", group: "Reference" },
] as const;

/** The groups in page order, each with its sections. */
export function docsGroups(): Array<{ group: DocsGroup; sections: DocsSection[] }> {
  const out: Array<{ group: DocsGroup; sections: DocsSection[] }> = [];
  for (const section of DOCS_SECTIONS) {
    const last = out[out.length - 1];
    if (last && last.group === section.group) last.sections.push(section);
    else out.push({ group: section.group, sections: [section] });
  }
  return out;
}
