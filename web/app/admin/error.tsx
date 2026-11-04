"use client";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mx-auto max-w-2xl rounded-panel bg-surface p-7 shadow-[0_18px_50px_rgb(34_25_78/0.08)] ring-1 ring-line">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-cannot">
        Dashboard error
      </p>
      <h1 className="mt-3 text-3xl font-bold">This view could not render</h1>
      <p className="mt-3 max-w-prose leading-6 text-muted">
        Your access has not changed. Retry the page, then check Product health
        if the issue continues.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 min-h-11 rounded-full bg-action px-5 font-bold text-on-action transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action focus-visible:ring-offset-2"
      >
        Try again
      </button>
    </section>
  );
}
