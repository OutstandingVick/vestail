"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { EmptyState } from "@/components/admin/EmptyState";
import { authedFetch, errorOf } from "@/lib/client";
import type { TesterApplication } from "@/lib/tester-application-schema";

const shortWallet = (wallet: string) => `${wallet.slice(0, 6)}…${wallet.slice(-6)}`;

export function TesterApplications() {
  const [applications, setApplications] = useState<TesterApplication[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await authedFetch("/api/admin/testers");
      if (!response.ok) throw new Error(await errorOf(response));
      setApplications((await response.json() as { applications: TesterApplication[] }).applications);
    } catch (error) { setError((error as Error).message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return applications;
    return applications.filter(row => [row.xHandle, row.email, row.telegram, row.country, row.wallet]
      .some(value => value.toLowerCase().includes(needle)));
  }, [applications, query]);

  if (loading) return <div className="rounded-card border border-line bg-surface p-8 text-center text-muted">Loading applications…</div>;
  if (error) return <div role="alert" className="rounded-card border border-cannot bg-surface p-6"><p className="font-semibold text-cannot">{error}</p><button type="button" onClick={load} className="mt-4 min-h-10 rounded-full border border-field px-4 text-sm font-semibold">Try again</button></div>;
  if (!applications.length) return <EmptyState title="No tester applications yet" detail="New submissions from the Call for Testers page will appear here." />;

  return <div className="space-y-5">
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-card border border-line bg-surface p-5"><p className="text-sm text-muted">Applications</p><p className="mt-1 text-3xl font-bold tabular-nums">{applications.length}</p></div>
      <div className="rounded-card border border-line bg-surface p-5"><p className="text-sm text-muted">Pending review</p><p className="mt-1 text-3xl font-bold tabular-nums">{applications.filter(row => row.status === "pending").length}</p></div>
      <div className="rounded-card border border-line bg-surface p-5"><p className="text-sm text-muted">Countries</p><p className="mt-1 text-3xl font-bold tabular-nums">{new Set(applications.map(row => row.country)).size}</p></div>
    </div>
    <div><label htmlFor="tester-search" className="sr-only">Search tester applications</label><input id="tester-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search name, email, Telegram, country or wallet" className="min-h-11 w-full max-w-xl rounded-field border border-field bg-surface px-4 text-sm outline-none focus:ring-2 focus:ring-ink/15" /></div>
    {visible.length ? <div className="overflow-x-auto rounded-card border border-line bg-surface"><table className="w-full min-w-[1100px] text-left text-sm"><caption className="sr-only">Tester applications</caption><thead className="bg-wash text-xs uppercase tracking-wide text-muted"><tr><th className="px-4 py-3.5">Applicant</th><th className="px-4 py-3.5">Country</th><th className="px-4 py-3.5">Experience</th><th className="px-4 py-3.5">Wallet</th><th className="px-4 py-3.5">Reason</th><th className="px-4 py-3.5">Applied</th><th className="px-4 py-3.5">Status</th></tr></thead><tbody className="divide-y divide-line">{visible.map(row => <tr key={`${row.email}-${row.wallet}`} className="align-top"><td className="px-4 py-4"><p className="font-semibold">{row.xHandle}</p><a href={`mailto:${row.email}`} className="mt-1 block text-xs text-muted hover:text-ink">{row.email}</a><p className="mt-1 text-xs text-muted">Telegram: {row.telegram}</p></td><td className="px-4 py-4"><p>{row.country}</p><p className="mt-1 text-xs text-muted">{row.relationship}</p></td><td className="px-4 py-4">{row.experience}</td><td className="px-4 py-4 font-mono text-xs" title={row.wallet}>{shortWallet(row.wallet)}</td><td className="max-w-xs px-4 py-4 text-muted">{row.reason || "—"}</td><td className="whitespace-nowrap px-4 py-4">{new Date(row.created_at).toLocaleDateString()}</td><td className="px-4 py-4"><span className="rounded-full bg-action-wash px-3 py-1 text-xs font-bold capitalize text-action-ink">{row.status}</span></td></tr>)}</tbody></table></div> : <EmptyState title="No matching applications" detail="Try a different search term." />}
  </div>;
}
