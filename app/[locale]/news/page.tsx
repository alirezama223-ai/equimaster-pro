import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import Navbar from "@/app/components/navbar/Navbar";
import NewsEventsHub from "@/app/components/news/NewsEventsHub";
import { localizePath } from "@/i18n/path";
import { routing, type AppLocale } from "@/i18n/routing";
import { getSiteBaseUrl } from "@/app/lib/seo/site-url";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("news");
  const locale = (await getLocale()) as AppLocale;
  const baseUrl = getSiteBaseUrl();
  const pathname = "/news";
  const canonicalUrl = `${baseUrl}${localizePath(pathname, locale)}`;
  const alternateLocales = routing.locales.filter((entry) => entry !== locale);
  const languages: Record<string, string> = {};

  for (const entry of routing.locales) {
    languages[entry] = `${baseUrl}${localizePath(pathname, entry)}`;
  }
  languages["x-default"] = `${baseUrl}${localizePath(pathname, routing.defaultLocale)}`;

  const title = t("title");
  const description = t("description");

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Shabdiz",
      type: "website",
      locale,
      alternateLocale: alternateLocales,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: { index: true, follow: true },
  };
}

export default function NewsPage() {
  return (
    <>
      <Navbar />
      <NewsEventsHub />
    </>
  );
}
