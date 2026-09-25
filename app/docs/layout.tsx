import type { ReactNode } from "react";

import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsSidebar } from "@/components/docs/DocsSidebar";

/**
 * Docs shell: sticky header, then a wide row that holds the sidebar and the
 * reading column. The column is capped near 70 characters of body text —
 * long-form argument, not a dashboard.
 *
 * `data-surface="docs"` is the hook the stylesheet looks for to reverse the
 * site gradient here: dark edges, light middle, under the reading column.
 */
export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    // data-surface marks the page for the gradient override in globals.css.
    <div data-surface="docs" className="flex min-h-svh flex-col">
      <DocsHeader />
      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-10 px-4 sm:px-8">
        <DocsSidebar />
        <div className="mx-auto min-w-0 max-w-2xl flex-1 py-12 sm:py-16">{children}</div>
      </div>
    </div>
  );
}
