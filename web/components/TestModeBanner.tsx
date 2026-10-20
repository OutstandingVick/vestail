import Link from "next/link";

import { safeHttps } from "@/lib/safeUrl";
import { FEEDBACK_URL, TEST_MODE } from "@/lib/test-mode";

/** Persistent notice and test-only actions; absent from every real-money build. */
export function TestModeBanner() {
  if (!TEST_MODE) return null;
  const feedback = safeHttps(FEEDBACK_URL);
  return (
    <aside className="sticky top-0 z-50 border-b border-cond bg-cond-wash px-4 py-2 text-cond-ink" aria-label="Test mode">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-2">
        <strong className="text-sm">Test mode — no real purchases.</strong>
        <nav aria-label="Test mode actions" className="flex flex-wrap items-center gap-2">
          <Link href="/app/test-portfolio" className="inline-flex min-h-10 items-center rounded-full px-3 text-sm font-semibold underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2">Test portfolio</Link>
          {feedback && <a href={feedback} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center rounded-full bg-action px-4 text-sm font-semibold text-on-action focus-visible:outline-2 focus-visible:outline-offset-2">Give feedback</a>}
        </nav>
      </div>
    </aside>
  );
}
