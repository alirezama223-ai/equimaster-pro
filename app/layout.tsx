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

export const metadata: Metadata = {
  metadataBase: new URL(getSiteBaseUrl()),
  applicationName: PUBLIC_BRAND,
  authors: [{ name: PUBLIC_BRAND }],
  creator: PUBLIC_BRAND,
  publisher: PUBLIC_BRAND,
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
