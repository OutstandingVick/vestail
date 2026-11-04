import Link from "next/link";

export default function AdminNotFound() {
  return (
    <section className="mx-auto max-w-2xl rounded-panel bg-surface p-7 shadow-[0_18px_50px_rgb(34_25_78/0.08)] ring-1 ring-line">
      <p className="text-xs font-bold uppercase tracking-[.18em] text-action">
        Vestail admin
      </p>
      <h1 className="mt-3 text-3xl font-bold">Dashboard page not found</h1>
      <p className="mt-3 max-w-prose leading-6 text-muted">That owner view does not exist. Return to the overview to continue reviewing Vestail.</p>
      <Link
        href="/admin"
        className="mt-6 inline-flex min-h-11 items-center rounded-full bg-action px-5 font-bold text-on-action"
      >
        Return to overview
      </Link>
    </section>
  );
}
