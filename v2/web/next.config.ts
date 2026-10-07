import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // v2 is its own npm workspace; without this Next picks the repo-root (v1) lockfile.
  outputFileTracingRoot: path.join(__dirname, ".."),
  // Privy is hoisted to v2/node_modules but some of its Solana peers install
  // here, in web/node_modules, so let hoisted packages resolve from here too.
  webpack(config) {
    config.resolve.modules = [...(config.resolve.modules ?? ["node_modules"]), path.join(__dirname, "node_modules")];
    return config;
  },
};

export default nextConfig;
