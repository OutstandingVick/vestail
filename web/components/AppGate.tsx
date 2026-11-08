"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { authedFetch } from "@/lib/client";
import type { Profile } from "@/lib/types";

// API routes enforce authentication; this gate only controls the signed-in screens.
export function AppGate({ profile, children }: { profile: Profile | null; children: React.ReactNode }) {
  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();
  const restored = useRef(false);

  useEffect(() => {
    if (ready && !authenticated) router.replace("/app");
  }, [ready, authenticated, router]);

  useEffect(() => {
    if (!authenticated || profile || restored.current) return;
    const saved = user?.customMetadata as { country?: string; who?: string } | undefined;
    if (!saved?.country || !saved?.who) return;
    restored.current = true;
    authedFetch("/api/profile", { method: "POST", body: JSON.stringify({ country: saved.country, who: saved.who }) })
      .then(r => r.ok && router.refresh());
  }, [authenticated, profile, user, router]);

  if (!ready || !authenticated) {
    return <div className="flex min-h-[60vh] items-center justify-center text-muted" role="status">Loading…</div>;
  }
  return <>{children}</>;
}
