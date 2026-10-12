"use client";

import { Check, Copy, Ticket, Trash } from "@phosphor-icons/react";
import { useCallback, useEffect, useState } from "react";

import { authedFetch, errorOf } from "@/lib/client";
import type { InviteRecord } from "@/lib/server/invites";

type GeneratedInvite = InviteRecord & { code: string };

export function InviteManager() {
  const [count, setCount] = useState(50);
  const [invites, setInvites] = useState<InviteRecord[]>([]);
  const [generated, setGenerated] = useState<GeneratedInvite[]>([]);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await authedFetch("/api/admin/invites");
    if (!response.ok) throw new Error(await errorOf(response));
    setInvites((await response.json() as { invites: InviteRecord[] }).invites);
  }, []);

  useEffect(() => { load().catch(error => setError(error.message)); }, [load]);

  async function generate() {
    setBusy(true); setError(""); setCopied(false);
    try {
      const response = await authedFetch("/api/admin/invites", { method: "POST", body: JSON.stringify({ count }) });
      if (!response.ok) throw new Error(await errorOf(response));
      const rows = (await response.json() as { invites: GeneratedInvite[] }).invites;
      setGenerated(rows);
      await load();
    } catch (error) { setError((error as Error).message); }
    finally { setBusy(false); }
  }

  async function copyCodes() {
    await navigator.clipboard.writeText(generated.map(invite => invite.code).join("\n"));
    setCopied(true);
  }

  async function revoke(id: string) {
    setError("");
    const response = await authedFetch("/api/admin/invites", { method: "DELETE", body: JSON.stringify({ id }) });
    if (!response.ok) { setError(await errorOf(response)); return; }
    await load();
  }

  const totals = invites.reduce<Record<string, number>>((all, invite) => ({ ...all, [invite.status]: (all[invite.status] ?? 0) + 1 }), {});

  return <div className="space-y-7">
    <section className="rounded-card border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-end gap-3">
        <div><label htmlFor="invite-count" className="block text-sm font-semibold">Number of codes</label><input id="invite-count" type="number" min={1} max={100} value={count} onChange={event => setCount(Number(event.target.value))} className="mt-2 min-h-11 w-36 rounded-field border border-field bg-wash px-3 text-base" /></div>
        <button type="button" onClick={generate} disabled={busy || count < 1 || count > 100} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-action px-5 font-bold text-on-action disabled:opacity-60"><Ticket size={19} weight="bold" aria-hidden="true" />{busy ? "Generating…" : "Generate codes"}</button>
      </div>
      <p className="mt-3 text-sm text-muted">Every code is single-use and expires 30 days after it is generated.</p>
      {error && <p role="alert" className="mt-4 text-sm text-cannot">{error}</p>}
    </section>

    {generated.length > 0 && <section className="rounded-card border border-action bg-action-wash p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-bold">Save these codes now</h2><p className="mt-1 text-sm text-muted">For security, the complete codes are shown only in this result.</p></div><button type="button" onClick={copyCodes} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-field bg-surface px-4 text-sm font-bold">{copied ? <Check size={18} weight="bold" /> : <Copy size={18} weight="bold" />}{copied ? "Copied" : "Copy all"}</button></div>
      <pre className="mt-4 max-h-72 overflow-auto rounded-field bg-ink-strong p-4 text-sm leading-7 text-on-ink">{generated.map(invite => invite.code).join("\n")}</pre>
    </section>}

    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-bold">Invitation history</h2><p className="mt-1 text-sm text-muted">{totals.active ?? 0} active · {totals.redeemed ?? 0} redeemed · {totals.expired ?? 0} expired · {totals.revoked ?? 0} revoked</p></div></div>
      {invites.length ? <div className="overflow-x-auto rounded-card border border-line bg-surface"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-wash text-xs uppercase tracking-wide text-muted"><tr><th className="px-5 py-3.5">Code</th><th className="px-5 py-3.5">Created</th><th className="px-5 py-3.5">Expires</th><th className="px-5 py-3.5">Status</th><th className="px-5 py-3.5 text-right">Action</th></tr></thead><tbody className="divide-y divide-line">{invites.map(invite => <tr key={invite.id}><td className="px-5 py-4 font-mono">{invite.hint}</td><td className="px-5 py-4 whitespace-nowrap">{new Date(invite.createdAt).toLocaleDateString()}</td><td className="px-5 py-4 whitespace-nowrap">{new Date(invite.expiresAt).toLocaleDateString()}</td><td className="px-5 py-4 capitalize">{invite.status}</td><td className="px-5 py-4 text-right">{invite.status === "active" ? <button type="button" onClick={() => revoke(invite.id)} className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 font-semibold text-cannot hover:bg-wash"><Trash size={17} aria-hidden="true" />Revoke</button> : <span className="text-muted">—</span>}</td></tr>)}</tbody></table></div> : <div className="rounded-card border border-dashed border-field bg-surface p-8 text-center text-muted">No invitation codes generated yet.</div>}
    </section>
  </div>;
}
