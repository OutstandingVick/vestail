"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { authedFetch } from "@/lib/client";
import type { Profile } from "@/lib/types";

/**
 * The app is for signed-in users: anyone else goes back to the front door.
 * (The real guarantees live in the API routes, which verify the Privy token;
 * this only keeps the screens tidy.)
 *
 * On a new device the profile cookie is empty but the Privy user still has
 * the country they declared, so it is restored from there. Nothing is ever
 * guessed: no saved profile means the app asks.
 */
export function AppGate({ profile, children }: { profile: Profile | null; children: React.ReactNode }) {
  const { ready, authenticated, user } = usePrivy();
  const router = useRouter();
  const restored = useRef(false);

  useEffect(() => {
    if (ready && !authenticated) router.replace("/");
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
