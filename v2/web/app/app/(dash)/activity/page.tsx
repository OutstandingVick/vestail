import { Suspense } from "react";

import { ActivityHistory } from "@/components/ActivityHistory";

export default function ActivityPage() {
  return (
    <div className="flex flex-col gap-7 pt-4">
      <header><p className="mb-2 text-xs font-bold uppercase tracking-[0.13em] text-action-ink">Account history</p><h1 className="text-[clamp(36px,5vw,64px)] font-extrabold leading-[1.02] tracking-[-0.05em]">Activity</h1><p className="mt-3 max-w-2xl leading-7 text-muted">Your complete history of buy presses routed through Vestail.</p></header>
      <p className="rounded-card bg-tint px-5 py-4 text-sm leading-6 text-muted"><strong className="text-ink">A recorded route is not a completed trade.</strong> A swap or order can still fail onchain or at the venue after you leave Vestail.</p>
      <Suspense fallback={<div className="h-40 animate-pulse rounded-panel bg-surface" />}><ActivityHistory /></Suspense>
    </div>
  );
}
