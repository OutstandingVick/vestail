import type { NextConfig } from "next";

/**
 * The RPC origin, for connect-src.
 *
 * Read here rather than hardcoded so a deploy pointing at its own provider
 * does not have to edit the policy — and so a policy that would block the
 * app's own RPC cannot ship.
 */
function rpcOrigin(): string {
  const url = process.env.NEXT_PUBLIC_RPC_URL?.trim();
  try {
    return url ? new URL(url).origin : "https://api.mainnet-beta.solana.com";
  } catch {
    return "https://api.mainnet-beta.solana.com";
  }
}

/**
 * Content-Security-Policy.
 *
 * The threat this closes is the one that matters for a signing app: any
 * script that reaches this page can rewrite the transaction between the
 * order and the wallet, and the user would sign the attacker's version
 * without seeing anything unusual. Restricting where scripts may come from
 * is the defence that does not depend on noticing.
 *
 * `'unsafe-inline'` is in script-src because Next inlines its own bootstrap;
 * removing it needs per-request nonces through middleware, which is a real
 * improvement and a bigger change than this one. `'unsafe-eval'` is
 * development only — the dev server's refresh runtime needs it, production
 * does not.
 *
 * connect-src lists what the app actually talks to: itself, the RPC, and
 * Jupiter. Solflare's web wallet is allowed to connect and to frame, since
 * that is how it signs for users without the extension.
 */
function csp(): string {
  const dev = process.env.NODE_ENV !== "production";
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
    // The wallet adapter's stylesheet imports a font from Google.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob:",
    `connect-src 'self' ${rpcOrigin()} https://api.jup.ag https://*.solflare.com wss://*.solflare.com${dev ? " ws://localhost:* http://localhost:*" : ""}`,
    "frame-src 'self' https://*.solflare.com",
    "worker-src 'self' blob:",
    // Nothing may frame Vestail: a signing button in someone else's page,
    // under their overlay, is a clickjacked signature.
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp() },
          // Belt and braces with frame-ancestors, for anything that predates it.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
