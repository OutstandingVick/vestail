import type { TRUST_CARDS } from "@/lib/landing/trustCards";

export function TrustIcon({ name }: { name: (typeof TRUST_CARDS)[number]["id"] }) {
  return (
    <svg width="36" height="36" viewBox="0 0 32 32" fill="none"
      stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true" focusable="false">
      {name === "wallet" && <>
        <path d="M26 10V7H8a4 4 0 0 0 0 8h20v13H8a4 4 0 0 1-4-4V11m5-4 13-4v4" />
        <path d="M28 17h-7a3 3 0 0 0 0 6h7m-7-3h1" />
      </>}
    </svg>
  );
}
