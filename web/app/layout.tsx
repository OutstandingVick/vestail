import type { Metadata } from "next";
import Script from "next/script";
import { DM_Sans, Geist, Inter, Manrope, Outfit, Syne } from "next/font/google";
import { Providers } from "@/components/Providers";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/seo";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const manrope = Manrope({ variable: "--font-manrope", subsets: ["latin"], weight: ["600", "700", "800"] });
const syne = Syne({ variable: "--font-syne", subsets: ["latin"], weight: ["600", "700"] });
const geist = Geist({ variable: "--font-geist", subsets: ["latin"] });
const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin"] });
const outfit = Outfit({ variable: "--font-outfit", subsets: ["latin"] });

const THEME_SCRIPT = `try{var t=localStorage.getItem("vestail-theme");document.documentElement.dataset.theme=t||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}catch(e){}`;

/*
 * The defaults every page inherits.
 *
 * metadataBase makes the relative URLs below absolute, which Open Graph
 * requires — a relative og:image is simply dropped by most crawlers. The title
 * template appends the brand to each page's own title rather than each page
 * repeating it, and `default` covers routes that set none.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Vestail — What Can You Own in Your Country? Stocks, Land, Gold",
    template: "%s · Vestail",
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
    title: "Vestail — What Can You Own in Your Country?",
    description: SITE_DESCRIPTION,
    locale: "en",
  },
  twitter: {
    card: "summary_large_image",
    site: "@usevestail",
    creator: "@usevestail",
    title: "Vestail — What Can You Own in Your Country?",
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${manrope.variable} ${syne.variable} ${geist.variable} ${dmSans.variable} ${outfit.variable}`} suppressHydrationWarning>
      <head>
        <link rel="stylesheet" href="/cookie-consent.css" />
        {/* Set the theme before first paint, the same way and under the same key as the marketing site. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Script src="/cookie-consent.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
