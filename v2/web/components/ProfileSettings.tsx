"use client";

import { ArrowSquareOut, Check, Copy, Export } from "@phosphor-icons/react";
import { useCreateWallet, useExportWallet as useExportEvmWallet, usePrivy, type WalletWithMetadata } from "@privy-io/react-auth";
import { useExportWallet as useExportSolanaWallet } from "@privy-io/react-auth/solana";
import QRCode from "qrcode";
import { useEffect, useState } from "react";

const isEmbedded = (w: WalletWithMetadata) => w.walletClientType === "privy" || w.walletClientType === "privy-v2";

/** One wallet: its address to deposit to, as text, a copy button and a QR code. */
function WalletCard({ wallet }: { wallet: WalletWithMetadata }) {
  const [qr, setQr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const { exportWallet: exportSolana } = useExportSolanaWallet();
  const { exportWallet: exportEvm } = useExportEvmWallet();
  const embedded = isEmbedded(wallet);
  const evm = wallet.chainType === "ethereum";

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
          <strong>{embedded ? `Your Vestail ${evm ? "EVM" : "Solana"} wallet` : "Your connected wallet"}</strong>
          {(evm ? ["Base", "Robinhood Chain"] : ["Solana"]).map(c => (
            <span key={c} className="rounded-full bg-tint px-2.5 py-0.5 text-xs font-semibold">{c}</span>
          ))}
          {!embedded && wallet.walletClientType && <span className="text-xs text-muted capitalize">{wallet.walletClientType}</span>}
        </div>
        <label htmlFor={`addr-${wallet.address}`} className="sr-only">Wallet address</label>
        <input id={`addr-${wallet.address}`} readOnly value={wallet.address} onFocus={e => e.currentTarget.select()}
          className="min-h-11 w-full rounded-field border-[1.5px] border-field bg-surface px-3 font-mono text-sm" />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={copy} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-action px-4 text-sm font-semibold text-on-action">
            {copied ? <Check size={16} weight="regular" aria-hidden="true" /> : <Copy size={16} weight="regular" aria-hidden="true" />}
            {copied ? "Copied" : "Copy address"}
          </button>
          {evm ? (
            <>
              <a href={`https://basescan.org/address/${wallet.address}`} target="_blank" rel="noreferrer"
                className="flex min-h-10 items-center gap-2 rounded-full border-[1.5px] border-field px-4 text-sm font-semibold">Basescan <ArrowSquareOut size={16} weight="regular" aria-hidden="true" /></a>
              <a href={`https://robinhoodchain.blockscout.com/address/${wallet.address}`} target="_blank" rel="noreferrer"
                className="flex min-h-10 items-center gap-2 rounded-full border-[1.5px] border-field px-4 text-sm font-semibold">Robinhood explorer <ArrowSquareOut size={16} weight="regular" aria-hidden="true" /></a>
            </>
          ) : (
            <a href={`https://solscan.io/account/${wallet.address}`} target="_blank" rel="noreferrer"
              className="flex min-h-10 items-center gap-2 rounded-full border-[1.5px] border-field px-4 text-sm font-semibold">View on Solscan <ArrowSquareOut size={16} weight="regular" aria-hidden="true" /></a>
          )}
          {embedded && (
            <button type="button" onClick={() => (evm ? exportEvm({ address: wallet.address }) : exportSolana({ address: wallet.address }))}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border-[1.5px] border-field px-4 text-sm font-semibold"><Export size={16} weight="regular" aria-hidden="true" />Export private key</button>
          )}
        </div>
        <p className="text-xs text-muted">
          {evm
            ? "One address on Base and Robinhood Chain. Send ETH on the network you'll buy on: it pays for the stock and the gas."
            : "Send USDC to buy, plus about 0.01 SOL for network fees."}
        </p>
        {embedded && (
          <p className="text-xs text-muted">
            Only you can see this key: it opens in Privy&apos;s secure window, which Vestail can&apos;t read. Anyone who can get
            into your email can sign in and use this wallet, so keep your email account secure.
          </p>
        )}
        <span role="status" className="sr-only">{copied ? "Address copied" : ""}</span>
      </div>
    </div>
  );
}

/**
 * Where to send funds: every wallet the user has, Solana and EVM. Deposits go
 * straight to the user's own wallet: Vestail never holds them. Embedded wallets
 * (made for email sign-ins) can be exported to any other wallet at any time.
 */
export function ProfileSettings() {
  const { user, linkWallet } = usePrivy();
  const { createWallet } = useCreateWallet();
  const [creating, setCreating] = useState(false);
  const wallets = (user?.linkedAccounts ?? [])
    .filter((a): a is WalletWithMetadata => a.type === "wallet" && ["solana", "ethereum"].includes((a as WalletWithMetadata).chainType))
    .sort((a, b) => a.chainType.localeCompare(b.chainType));
  const hasEvm = wallets.some(w => w.chainType === "ethereum");

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
          No wallet is linked yet. Sign out and back in to create one, or link Phantom, Solflare or MetaMask.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {!hasEvm && (
          <button type="button" disabled={creating} onClick={async () => { setCreating(true); try { await createWallet(); } finally { setCreating(false); } }}
            className="min-h-11 rounded-full bg-ink px-5 font-semibold text-page disabled:opacity-60">
            {creating ? "Creating…" : "Create an EVM wallet (Base, Robinhood Chain)"}
          </button>
        )}
        <button type="button" onClick={() => linkWallet()} className="min-h-11 rounded-full border-[1.5px] border-field px-5 font-semibold">
          Link another wallet
        </button>
      </div>

      <div className="rounded-field bg-cond-wash px-4 py-3 text-sm text-cond-ink">
        <strong>Send on the right network.</strong> Solana buys are paid in <strong>USDC</strong> with a little
        <strong> SOL</strong> for fees. Base and Robinhood Chain buys are paid in <strong>ETH</strong> on that same network.
        Funds sent on any other chain won&apos;t show up here.
      </div>
    </section>
  );
}
