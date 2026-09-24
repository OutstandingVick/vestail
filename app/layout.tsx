import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { SolanaProvider } from "@/components/SolanaProvider";
import "./globals.css";

/* Outfit is the brand face and sets everything. */
const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

/**
 * The description is what a judge or a user reads under the link before they
 * click it, so it has to be current: the old one said Vestail "routes a
 * purchase only to eligible ones", which stopped being true on 2026-09-22
 * when conditional versions became routable behind an acknowledgement.
 */
const DESCRIPTION =
  "One ticker is several different legal claims onchain. Vestail shows every tokenized version of a stock, what each one legally is, and whether someone in your country may actually hold it — then buys only the ones you may.";

export const metadata: Metadata = {
  // Set so relative URLs in the tags below resolve, and so a shared link
  // unfurls against the real site rather than against localhost.
  metadataBase: new URL("https://vestail.fun"),
  title: "Vestail — Acquire the right onchain stocks",
  description: DESCRIPTION,
  icons: { icon: { url: "/brand/vestail-icon.svg", type: "image/svg+xml" } },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Vestail",
    title: "Vestail — the version of the stock you're actually allowed to hold",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "Vestail — the version of the stock you're actually allowed to hold",
    description: DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <SolanaProvider>{children}</SolanaProvider>
      </body>
    </html>
  );
}
