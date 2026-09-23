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
      {name === "sources" && <>
        <path d="M16 28H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h12l7 7v6M19 3v7h7M10 11h4m-4 5h8m-8 5h3" />
        <path d="m21 22 2-2a3 3 0 0 1 4 4l-2 2m-4-4-2 2a3 3 0 0 0 4 4l2-2m-4 0 4-4" />
      </>}
    </svg>
  );
}
