"use client";

import { useLogin, usePrivy } from "@privy-io/react-auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { AppFooter } from "@/components/AppFooter";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * The marketing site lives at v2/app/index.html. This is the app's front door:
 * the same headline, and Try App opens the sign-in popup (email or Solana
 * wallet). Signed-in visitors go straight to the app.
 */
export default function Landing() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const { login } = useLogin({ onComplete: () => router.push("/app") });
  const prompted = useRef(false);

  useEffect(() => {
    if (!ready) return;
    if (authenticated) router.replace("/app");
    // The marketing site's Try App links here with ?signin, so the popup opens straight away.
    else if (!prompted.current && new URLSearchParams(window.location.search).has("signin")) {
      prompted.current = true;
      login();
    }
  }, [ready, authenticated, router, login]);

  return (
    <div className="mx-auto flex min-h-screen max-w-[1180px] flex-col px-4">
      <header className="mx-auto flex max-w-[1180px] items-center gap-4 px-4 py-4">
        <Link href="/" aria-label="Vestail" className="grow"><Logo /></Link>
        <ThemeToggle />
        <button
          type="button"
          onClick={() => login()}
          disabled={!ready}
          className="min-h-11 rounded-full bg-action px-5 font-semibold text-on-action disabled:opacity-60"
        >
          Try App
        </button>
      </header>
      <main id="methodology" className="mx-auto flex max-w-[1000px] grow flex-col items-center gap-6 px-4 pt-20 pb-32 text-center">
        <h1 className="text-[clamp(44px,7vw,96px)] leading-none font-extrabold tracking-[-0.04em] text-ink-strong">
          What can you actually own here?
        </h1>
        <p className="max-w-[620px] text-lg text-muted">
          Tokenized stocks on Solana, Base and Robinhood Chain, gold, oil and copper exposure on Hyperliquid, and who can own
          20 kinds of assets in 12 countries. See what each one legally is, whether you can own it, and buy where you&apos;re allowed.
        </p>
        <button
          type="button"
          onClick={() => login()}
          disabled={!ready}
          className="min-h-14 rounded-full bg-action px-8 text-lg font-bold text-on-action disabled:opacity-60"
        >
          Try App
        </button>
      </main>
      <AppFooter />
    </div>
  );
}
