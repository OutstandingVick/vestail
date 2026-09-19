"use client";

import { useMemo, type ReactNode } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";

import { RPC_URL } from "@/lib/constants";

// Base styles for the wallet modal and button. Imported once, here.
import "@solana/wallet-adapter-react-ui/styles.css";

/**
 * Wallet and RPC context for the whole app.
 *
 * Vestail is non-custodial: this provider gives us a public key to read
 * balances with and a signer to hand transactions to. It never holds keys and
 * never signs on the user's behalf — every transaction is signed in the user's
 * own wallet.
 *
 * `autoConnect` is on so a returning user with an already-authorised wallet
 * lands on a resolved state instead of an empty one.
 */
export function SolanaProvider({ children }: { children: ReactNode }) {
  /*
   * Adapter instances are stateful and must not be rebuilt on every render.
   * Phantom and Solflare are listed explicitly rather than pulled in as the
   * full adapter set, so the bundle carries two adapters instead of thirty.
   */
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  );

  return (
    <ConnectionProvider endpoint={RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
