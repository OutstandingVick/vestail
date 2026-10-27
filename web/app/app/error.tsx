"use client";

import { useEffect } from "react";

/**
 * What the signed-in app shows when something throws.
 *
 * There was nothing here before, and in the App Router that means a thrown
 * error renders an empty document — a black screen with a cursor on it. The
 * first person outside the team to sign up hit exactly that after choosing
 * their country, and had no way to tell a crash from a page that never loaded.
 *
 * A boundary cannot stop the error, but it can stop the silence: say something
 * happened, offer the two things that actually help, and log the digest so the
 * report that reaches us names the failure.
 */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Vestail app error", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Something went wrong on our side</h1>
        <p className="max-w-[46ch] text-muted">
          Your account and your declared country are safe — this page failed to load, nothing else.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="min-h-11 rounded-full bg-action px-5 font-semibold text-on-action"
        >
          Try again
        </button>
        {/*
          * A plain anchor on purpose, not next/link. This is the escape hatch
          * from a broken client, and a client-side navigation would reuse the
          * same router cache that may be the thing at fault. A full load
          * throws all of it away.
          */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a href="/app/start" className="min-h-11 rounded-full px-5 py-3 font-semibold underline">
          Start over
        </a>
      </div>

      {error.digest ? (
        <p className="text-sm text-muted">
          Quote this if you report it: <code className="font-mono">{error.digest}</code>
        </p>
      ) : null}
    </main>
  );
}
