import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import "./globals.css";

/*
 * Two families, two jobs. Source Serif 4 carries display copy — the headline
 * and the verdict language — because the product is making a claim about a
 * legal instrument and wants to read like a document. Inter carries everything
 * operational: balances, mints, addresses, labels.
 */
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vestail — which version of this stock may you hold?",
  description:
    "A stock ticker is not one thing onchain. Vestail resolves every tokenized representation of a security, shows which ones a holder in a given jurisdiction may actually hold, and routes a purchase only to eligible ones.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${sourceSerif.variable} ${inter.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
