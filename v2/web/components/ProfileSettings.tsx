"use client";

import { usePrivy, type WalletWithMetadata } from "@privy-io/react-auth";
import { useExportWallet } from "@privy-io/react-auth/solana";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

const isEmbedded = (w: WalletWithMetadata) => w.walletClientType === "privy" || w.walletClientType === "privy-v2";

/** One wallet: its address to deposit to, as text, a copy button and a QR code. */
function WalletCard({ wallet }: { wallet: WalletWithMetadata }) {
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { exportWallet } = useExportWallet();
  const embedded = isEmbedded(wallet);

  useEffect(() => {
    QRCode.toDataURL(wallet.address, { margin: 1, width: 320, color: { dark: "#0D0D0F", light: "#FFFFFF" } }).then(setQr);
  }, [wallet.address]);

  async function copy() {
    await navigator.clipboard.writeText(wallet.address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-wrap items-center gap-5 rounded-card bg-wash p-5">
      {qr
        // A generated data URL: nothing for next/image to optimise.
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={qr} alt={`QR code for ${wallet.address}`} width={148} height={148} className="rounded-xl bg-white p-1.5" />
        : <div className="size-[148px] rounded-xl bg-surface" aria-hidden="true" />}
      <div className="flex min-w-0 flex-[1_1_280px] flex-col gap-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <strong>{embedded ? "Your Vestail wallet" : "Your connected wallet"}</strong>
          <span className="rounded-full bg-tint px-2.5 py-0.5 text-xs font-semibold">Solana</span>
          {!embedded && wallet.walletClientType && <span className="text-xs text-muted capitalize">{wallet.walletClientType}</span>}
        </div>
        <label htmlFor={`addr-${wallet.address}`} className="sr-only">Wallet address</label>
        <input id={`addr-${wallet.address}`} readOnly value={wallet.address} onFocus={e => e.currentTarget.select()}
          className="min-h-11 w-full rounded-field border-[1.5px] border-field bg-surface px-3 font-mono text-sm" />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={copy} className="min-h-10 rounded-full bg-action px-4 text-sm font-semibold text-on-action">
            {copied ? "Copied" : "Copy address"}
          </button>
          <a href={`https://solscan.io/account/${wallet.address}`} target="_blank" rel="noreferrer"
            className="flex min-h-10 items-center rounded-full border-[1.5px] border-field px-4 text-sm font-semibold">View on Solscan ↗</a>
          {embedded && (
            <button type="button" onClick={() => exportWallet({ address: wallet.address })}
              className="min-h-10 rounded-full border-[1.5px] border-field px-4 text-sm font-semibold">Export private key</button>
          )}
        </div>
        <span role="status" className="sr-only">{copied ? "Address copied" : ""}</span>
      </div>
    </div>
  );
}

/**
 * Who the user is to Vestail, and where to send funds. Deposits go straight to
 * the user's own Solana wallet: Vestail never holds them. Embedded wallets
 * (made for email sign-ins) can be exported to any other wallet at any time.
 */
export function ProfileSettings() {
  const { user } = usePrivy();
  const wallets = (user?.linkedAccounts ?? []).filter(
    (a): a is WalletWithMetadata => a.type === "wallet" && (a as WalletWithMetadata).chainType === "solana",
  );

  return (
    <section id="wallet" aria-labelledby="profile-title" className="scroll-mt-4 flex flex-col gap-4 rounded-panel bg-surface p-6">
      <div>
        <h2 id="profile-title" className="text-lg font-bold">Wallet and deposits</h2>
        <p className="text-sm text-muted">
          Signed in as <strong className="text-ink">{user?.email?.address ?? "your wallet"}</strong>.
          {" "}Deposit to the address below to fund buys; the funds stay in your own wallet.
        </p>
      </div>

      {wallets.length ? wallets.map(w => <WalletCard key={w.address} wallet={w} />) : (
        <p className="rounded-field bg-wash px-4 py-6 text-center text-sm text-muted">
          No Solana wallet is linked yet. Sign out and back in to create one, or sign in with Phantom or Solflare.
        </p>
      )}

      <div className="rounded-field bg-cond-wash px-4 py-3 text-sm text-cond-ink">
        <strong>Send only on the Solana network.</strong> Buys are paid in <strong>USDC</strong>, and you need a little
        <strong> SOL</strong> (about 0.01) for network fees. Tokens sent from another chain, such as USDC on Ethereum, will not arrive.
      </div>
    </section>
  );
}
