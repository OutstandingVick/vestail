"use client";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="rounded-panel border border-line bg-surface p-7"><p className="text-xs font-bold uppercase tracking-[.18em] text-cannot">Dashboard error</p><h1 className="mt-3 text-3xl font-bold">This view could not render</h1><p className="mt-3 text-muted">Your access has not changed. Retry the page, then check Product health if the issue continues.</p><button type="button" onClick={reset} className="mt-6 min-h-11 rounded-full bg-action px-5 font-bold text-on-action">Try again</button></section>;
}
