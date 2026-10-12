import Link from "next/link";

export default function AdminNotFound() {
  return <section className="rounded-panel border border-line bg-surface p-7"><p className="text-xs font-bold uppercase tracking-[.18em] text-action">Vestail admin</p><h1 className="mt-3 text-3xl font-bold">Dashboard page not found</h1><p className="mt-3 text-muted">That owner view does not exist.</p><Link href="/admin" className="mt-6 inline-flex min-h-11 items-center rounded-full bg-action px-5 font-bold text-on-action">Return to overview</Link></section>;
}
