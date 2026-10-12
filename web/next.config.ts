import path from "node:path";
import type { NextConfig } from "next";

/**
 * Security headers. Any script running on a page where people sign can swap
 * the transaction, so the app's pages only load code from this origin and
 * Privy (sign-in, embedded wallets, WalletConnect), and no page may be
 * framed, which stops a signing flow being clickjacked from another site.
 *
 * 'unsafe-inline' for scripts is needed by Next's inline bootstrap and the
 * pre-paint theme script; moving to per-request nonces would remove it.
 * 'unsafe-eval' is only added in development (React refresh needs it).
 */
const dev = process.env.NODE_ENV !== "production";
const PRIVY = ["https://auth.privy.io", "https://*.privy.io", "https://*.privy.systems"];
const WALLETCONNECT = ["https://*.walletconnect.com", "https://*.walletconnect.org", "wss://*.walletconnect.com", "wss://*.walletconnect.org", "wss://www.walletlink.org"];
const appCsp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src 'self' ${[...PRIVY, ...WALLETCONNECT, "https://*.rpc.privy.systems", "https://api.mainnet-beta.solana.com", "https://mainnet.base.org", "https://rpc.mainnet.chain.robinhood.com"].join(" ")}${dev ? " ws://localhost:*" : ""}`,
  `frame-src ${[...PRIVY, "https://verify.walletconnect.com", "https://verify.walletconnect.org", "https://challenges.cloudflare.com"].join(" ")}`,
  "child-src 'self' https://auth.privy.io",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");
const siteCsp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  `img-src 'self' data: https:`,
  "connect-src 'self' http://localhost:8787 https:",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join("; ");
const common = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/early\\+access", destination: "/early-access", permanent: true },
      { source: "/early%2Baccess", destination: "/early-access", permanent: true },
    ];
  },
  async headers() {
    return [
      { source: "/", headers: [...common, { key: "Content-Security-Policy", value: siteCsp }] },
      { source: "/early-access", headers: [...common, { key: "Content-Security-Policy", value: siteCsp }] },
      { source: "/app/:path*", headers: [...common, { key: "Content-Security-Policy", value: appCsp }] },
      { source: "/app", headers: [...common, { key: "Content-Security-Policy", value: appCsp }] },
      { source: "/api/:path*", headers: common },
    ];
  },
  // v2 is its own npm workspace; without this Next picks the repo-root (v1) lockfile.
  outputFileTracingRoot: path.join(__dirname, ".."),
  /*
   * npm hoists next to v2/node_modules, so nothing inside web/ imports it by a
   * path the tracer can see, and Vercel's packaging step then fails on
   *   Cannot find module 'next/dist/compiled/next-server/server.runtime.prod.js'
   * because the shim it writes beside the app requires that file at a point
   * where only traced files exist. It is loaded dynamically, so it is never
   * traced on its own; naming it here puts it in the bundle.
   */
  outputFileTracingIncludes: {
    "/**": [
      "../node_modules/next/dist/compiled/next-server/**",
      /*
       * The API runs in this process (lib/server/local-api.ts) and reads the
       * rule data and the OpenAPI contract from outside web/, by paths built
       * at runtime from import.meta.url. The tracer cannot follow those, so
       * without naming them here the deployment ships without the rules and
       * every signed-in page fails.
       */
      "../data/**",
      "../docs/api/openapi.yaml",
      // The API itself is loaded at runtime (webpackIgnore), so nothing in the
      // bundle points at these files for the tracer to follow.
      "../services/api/src/**",
      "../services/api/package.json",
      "../packages/core/**",
    ],
  },
  // Privy is hoisted to v2/node_modules but some of its Solana peers install
  // here, in web/node_modules, so let hoisted packages resolve from here too.
  webpack(config) {
    config.resolve.modules = [...(config.resolve.modules ?? ["node_modules"]), path.join(__dirname, "node_modules")];
    return config;
  },
};

export default nextConfig;
