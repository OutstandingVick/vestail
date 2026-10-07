import type { Source } from "@/lib/types";

/**
 * Where a class verdict comes from. All 480 class rules are unsourced today,
 * and this says so plainly: no invented source, no invented date.
 */
export function Provenance({ sources, verifiedAt }: { sources: Source[]; verifiedAt: string | null }) {
  if (!sources.length) {
    return (
      <div className="flex flex-col gap-1 rounded-field border-[1.5px] border-dashed border-field px-4 py-3.5">
        <strong className="text-sm">Sources: not yet sourced</strong>
        <span className="text-sm text-muted">
          This rule hasn&apos;t been checked against a document yet. Treat it as a guide, not legal advice.
          Last verified: {verifiedAt ?? "never"}.
        </span>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2 rounded-field bg-wash px-4 py-3.5">
      <strong className="text-sm">Sources · last verified {verifiedAt ?? "never"}</strong>
      <ul className="flex flex-col gap-1 text-sm">
        {sources.map(s => (
          <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer" className="text-emphasis underline">{s.title}</a></li>
        ))}
      </ul>
    </div>
  );
}
