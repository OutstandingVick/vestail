import type { ReactNode } from "react";

import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsSidebar } from "@/components/docs/DocsSidebar";

/**
 * Docs shell: sticky header, then a wide row that holds the sidebar and the
 * reading column. The column is capped near 70 characters of body text —
 * long-form argument, not a dashboard.
 */
export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <DocsHeader />
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-10 px-4 sm:px-8">
        <DocsSidebar />
        <div className="min-w-0 flex-1 py-12 sm:py-16">{children}</div>
      </div>
    </div>
  );
}
