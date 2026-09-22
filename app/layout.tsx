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

export const metadata: Metadata = {
  title: "Vestail — which version of this stock may you hold?",
  icons: { icon: { url: "/brand/vestail-icon.svg", type: "image/svg+xml" } },
  description:
    "A stock ticker is not one thing onchain. Vestail resolves every tokenized representation of a security, shows which ones a holder in a given jurisdiction may actually hold, and routes a purchase only to eligible ones.",
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
