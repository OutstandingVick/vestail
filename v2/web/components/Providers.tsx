"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";

const solanaConnectors = toSolanaWalletConnectors({ shouldAutoConnect: true });

/**
 * Privy is the whole sign-in: an emailed one-time code, or a Solana wallet
 * (Phantom, Solflare and other standard wallets). People who sign in by email
 * get an embedded Solana wallet so they can buy onchain; wallet users keep
 * their own. No identity checks: this is login, not KYC.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  if (!appId) {
    return (
      <div className="m-6 rounded-card bg-surface p-6 text-sm">
        NEXT_PUBLIC_PRIVY_APP_ID is not set. Add it to <code>web/.env.local</code> and restart the dev server.
      </div>
    );
  }
  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["email", "wallet"],
        appearance: {
          theme: "light",
          accentColor: "#FF580A",
          logo: "/vestail-logo.svg",
          walletChainType: "solana-only",
          walletList: ["phantom", "solflare", "backpack", "detected_solana_wallets"],
          landingHeader: "Open Vestail",
          loginMessage: "Sign in to save your country and buy. No ID, no KYC.",
        },
        externalWallets: { solana: { connectors: solanaConnectors } },
        embeddedWallets: { solana: { createOnLogin: "users-without-wallets" }, ethereum: { createOnLogin: "off" } },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
