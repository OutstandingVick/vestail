"use client";

import { usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import { useEffect, useState } from "react";

import { AdminContext } from "@/components/admin/AdminContext";
import { authedFetch } from "@/lib/client";
import type { AdminOverview } from "@/lib/admin-types";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, login } = usePrivy();
  const [data, setData] = useState<AdminOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready || !authenticated) return;
    authedFetch("/api/admin/overview")
      .then(async response => {
        if (!response.ok) throw new Error(response.status === 403 ? "This account is not on the owner allowlist." : "Owner data could not be loaded.");
        setData(await response.json());
      })
      .catch(reason => setError(reason instanceof Error ? reason.message : "Owner data could not be loaded."));
  }, [ready, authenticated]);

  if (!ready) return <AdminLoading />;
  if (!authenticated) return <AccessCard title="Sign in to continue" detail="The owner dashboard requires your Vestail account."><button onClick={login} className="min-h-11 rounded-full bg-action px-5 font-bold text-on-action">Sign in</button></AccessCard>;
  if (error) return <AccessCard title="Owner access required" detail={error}><Link href="/app" className="inline-flex min-h-11 items-center rounded-full border border-field px-5 font-semibold">Back to Vestail</Link></AccessCard>;
  if (!data) return <AdminLoading />;
  return <AdminContext.Provider value={data}>{children}</AdminContext.Provider>;
}

function AdminLoading() {
  return <div className="grid min-h-screen place-items-center bg-page" role="status"><p className="text-sm font-semibold text-muted">Loading owner dashboard…</p></div>;
}

function AccessCard({ title, detail, children }: { title: string; detail: string; children: React.ReactNode }) {
  return <main className="grid min-h-screen place-items-center bg-page p-6"><section className="w-full max-w-md rounded-panel border border-line bg-surface p-7"><p className="text-xs font-bold uppercase tracking-[.18em] text-action">Vestail admin</p><h1 className="mt-3 text-3xl font-bold">{title}</h1><p className="mt-3 mb-6 leading-7 text-muted">{detail}</p>{children}</section></main>;
}
