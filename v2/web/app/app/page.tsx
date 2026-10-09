"use client";

import { Wallet } from "@phosphor-icons/react";
import { useLogin, useLoginWithEmail, usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Logo } from "@/components/Logo";

type Mode = "signup" | "login";

/**
 * /app: the way into Vestail. Sign up or log in with an emailed code, or with
 * a Solana or EVM wallet. Login only, never KYC. Signed-in visitors go
 * straight to their portfolio (or to onboarding, if they haven't declared a
 * country yet; the dashboard layout handles that).
 */
export default function SignInPage() {
  const router = useRouter();
  const { ready, authenticated } = usePrivy();
  const done = () => router.replace("/app/portfolio");
  const { login } = useLogin({ onComplete: done });
  const { sendCode, loginWithCode, state } = useLoginWithEmail({ onComplete: done });
  const [mode, setMode] = useState<Mode>("signup");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const awaitingCode = state.status === "awaiting-code-input" || state.status === "submitting-code";

  useEffect(() => {
    if (ready && authenticated) router.replace("/app/portfolio");
  }, [ready, authenticated, router]);

  async function run(fn: () => Promise<void>, fallback: string) {
    setBusy(true); setError(null);
    try { await fn(); } catch (e) {
      const msg = (e as Error).message ?? "";
      setError(/not found|disable.*signup|no account/i.test(msg) && mode === "login"
        ? "No account uses that email yet. Switch to Sign up."
        : fallback);
    }
    setBusy(false);
  }

  const tab = (m: Mode, label: string) => (
    <button type="button" role="tab" aria-selected={mode === m} onClick={() => { setMode(m); setError(null); setCode(""); }}
      className={`min-h-11 flex-1 rounded-full text-[15px] font-semibold transition-colors ${mode === m ? "bg-ink text-page" : "text-muted hover:text-ink"}`}>
      {label}
    </button>
  );

  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden">
      {/* Background: the site's globe, soft brand-colour light and a quiet dot grid. Decorative only. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(var(--color-field)_1px,transparent_1px)] [background-size:22px_22px] opacity-60" />
        <div className="absolute top-[-12%] left-[-10%] size-[46vmax] rounded-full bg-action opacity-[0.16] blur-[90px]" />
        <div className="absolute right-[-12%] bottom-[-18%] size-[50vmax] rounded-full bg-[#7C5CFF] opacity-[0.20] blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 size-[min(92vw,880px)] -translate-x-1/2 -translate-y-1/2 bg-[url('/assets/atlantic-earth-globe.png')] bg-contain bg-center bg-no-repeat opacity-[0.13] saturate-[0.7]" />
      </div>

      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-12 sm:py-16">
        <div className="flex flex-col items-center text-center">
          <Logo className="h-11 w-auto sm:h-13" />
          <p className="mt-4 max-w-[560px] text-muted">
            See what you can own where you are, and buy it where you&apos;re allowed.
          </p>
        </div>

        <div className="text-center">
          <h1 className="text-[clamp(32px,4.5vw,48px)] leading-tight font-extrabold tracking-[-0.03em] text-ink-strong">
            {mode === "signup" ? "Start owning, the right way" : "Welcome back"}
          </h1>
        </div>

        <section aria-label={mode === "signup" ? "Sign up" : "Log in"}
          className="w-full max-w-[440px] rounded-panel border border-line bg-surface/90 p-6 shadow-[0_30px_80px_-30px_rgba(124,92,255,0.45)] backdrop-blur sm:p-8">
          <div role="tablist" aria-label="Sign up or log in" className="mb-6 flex gap-1 rounded-full bg-tint p-1">
            {tab("signup", "Sign up")}
            {tab("login", "Log in")}
          </div>

          {!awaitingCode ? (
            <form className="flex flex-col gap-3" onSubmit={e => { e.preventDefault(); run(() => sendCode({ email: email.trim(), disableSignup: mode === "login" }), "We couldn't send a code. Check the email and try again."); }}>
              <label htmlFor="email" className="text-sm font-semibold">Email</label>
              <input id="email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                className="min-h-12 rounded-field border-[1.5px] border-field bg-wash px-4 text-[16px]" />
              <button type="submit" disabled={!ready || busy} className="min-h-12 rounded-full bg-action font-semibold text-on-action disabled:opacity-60">
                {busy ? "Sending…" : mode === "signup" ? "Create account" : "Email me a code"}
              </button>
            </form>
          ) : (
            <form className="flex flex-col gap-3" onSubmit={e => { e.preventDefault(); run(() => loginWithCode({ code: code.trim() }), "That code didn't work. Check it, or send a new one."); }}>
              <label htmlFor="code" className="text-sm font-semibold">Enter the 6-digit code sent to {email}</label>
              <input id="code" inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={e => setCode(e.target.value)} maxLength={6}
                className="min-h-12 rounded-field border-[1.5px] border-field bg-wash px-4 text-center font-mono text-xl tracking-[0.4em]" />
              <button type="submit" disabled={busy || code.trim().length < 6} className="min-h-12 rounded-full bg-action font-semibold text-on-action disabled:opacity-60">
                {busy || state.status === "submitting-code" ? "Checking…" : mode === "signup" ? "Verify and continue" : "Log in"}
              </button>
              <button type="button" onClick={() => run(() => sendCode({ email: email.trim(), disableSignup: mode === "login" }), "We couldn't resend the code.")}
                className="text-sm font-semibold text-emphasis">Send a new code</button>
            </form>
          )}

          <div className="my-5 flex items-center gap-3 text-[13px] text-muted">
            <span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" />
          </div>
          <button type="button" disabled={!ready} onClick={() => login({ loginMethods: ["wallet"] })}
            className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border-[1.5px] border-field bg-surface font-semibold hover:bg-wash disabled:opacity-60">
            <Wallet size={18} weight="regular" aria-hidden="true" />
            Continue with a wallet
          </button>
          <p className="mt-3 text-center text-xs text-muted">Phantom, Solflare, MetaMask, Rabby or Coinbase Wallet.</p>

          {error && <p role="alert" className="mt-4 text-center text-sm text-cannot">{error}</p>}
        </section>

        <p className="max-w-[440px] text-center text-xs text-muted">
          No ID or KYC: you tell Vestail your country, it never detects it. Sign-in is by Privy; email sign-ups get their own
          wallet, which only they can use.
        </p>
      </main>
    </div>
  );
}
