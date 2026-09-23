"use client";

import { useMemo, type ReactNode } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";

import { RPC_URL } from "@/lib/constants";

/*
 * Base styles for the wallet modal and button, vendored rather than imported
 * from the package: the published stylesheet pulls a font from Google, on
 * the page where people sign transactions. See the file's own note.
 */
import "./wallet-adapter.css";

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
   *
   * The two adapters are imported from their own packages rather than from
   * the @solana/wallet-adapter-wallets barrel. The barrel re-exports every
   * adapter, which drags in the WalletConnect and Reown AppKit trees whether
   * or not they are used.
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
