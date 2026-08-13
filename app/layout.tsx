import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist } from "next/font/google";
import { routing } from "@/i18n/routing";
import { getSiteBaseUrl } from "@/app/lib/seo/site-url";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const PUBLIC_BRAND = "SHABDIZ";
const SITE_DESCRIPTION = "Global equestrian marketplace";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteBaseUrl()),
  applicationName: PUBLIC_BRAND,
  title: {
    default: PUBLIC_BRAND,
    template: `%s | ${PUBLIC_BRAND}`,
  },
  description: SITE_DESCRIPTION,
  authors: [{ name: PUBLIC_BRAND }],
  creator: PUBLIC_BRAND,
  publisher: PUBLIC_BRAND,
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.svg",
  },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    siteName: PUBLIC_BRAND,
    title: PUBLIC_BRAND,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/brand/shabdiz-og.svg",
        width: 1200,
        height: 630,
        alt: "SHABDIZ — Equine Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: PUBLIC_BRAND,
    description: SITE_DESCRIPTION,
    images: ["/brand/shabdiz-og.svg"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerStore = await headers();
  const locale =
    headerStore.get("x-next-intl-locale") ?? routing.defaultLocale;

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
