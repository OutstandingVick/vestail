import type { Metadata } from "next";
import { Outfit, Source_Serif_4 } from "next/font/google";
import { SolanaProvider } from "@/components/SolanaProvider";
import "./globals.css";

/*
 * Outfit is the brand face and sets everything by default. Source Serif 4 is
 * kept only for the app's display headings (font-display), which read like a
 * document because they make a claim about a legal instrument.
 */
const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
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
      className={`${sourceSerif.variable} ${outfit.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <SolanaProvider>{children}</SolanaProvider>
      </body>
    </html>
  );
}
