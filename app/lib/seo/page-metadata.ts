import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { localizePath } from "@/i18n/path";
import { routing, type AppLocale } from "@/i18n/routing";
import { getSiteBaseUrl } from "@/app/lib/seo/site-url";

export type MetadataPageKey =
  | "home"
  | "marketplace"
  | "horses"
  | "stallions"
  | "breeders"
  | "bloodlines"
  | "breedingLab"
  | "breedingRecommendations"
  | "login"
  | "signup"
  | "account"
  | "sell"
  | "favorites"
  | "notifications"
  | "training"
  | "admin"
  | "sellerDashboard";

const NO_INDEX_PAGES = new Set<MetadataPageKey>([
  "login",
  "signup",
  "account",
  "sell",
  "favorites",
  "notifications",
  "training",
  "admin",
  "sellerDashboard",
]);

function buildLanguageAlternates(pathname: string, baseUrl: string): Record<string, string> {
  const languages: Record<string, string> = {};

  for (const locale of routing.locales) {
    languages[locale] = `${baseUrl}${localizePath(pathname, locale)}`;
  }

  languages["x-default"] = `${baseUrl}${localizePath(pathname, routing.defaultLocale)}`;

  return languages;
}

export async function createPageMetadata(
  pageKey: MetadataPageKey,
  pathname: string,
  options?: { robots?: Metadata["robots"] }
): Promise<Metadata> {
  const t = await getTranslations("metadata");
  const locale = (await getLocale()) as AppLocale;
  const baseUrl = getSiteBaseUrl();
  const prefix = `pages.${pageKey}`;
  const canonicalPath = localizePath(pathname, locale);
  const canonicalUrl = `${baseUrl}${canonicalPath}`;
  const alternateLocales = routing.locales.filter((entry) => entry !== locale);
  const robots =
    options?.robots ??
    (NO_INDEX_PAGES.has(pageKey) ? { index: false, follow: false } : { index: true, follow: true });

  return {
    title: t(`${prefix}.title`),
    description: t(`${prefix}.description`),
    keywords: t(`${prefix}.keywords`),
    alternates: {
      canonical: canonicalUrl,
      languages: buildLanguageAlternates(pathname, baseUrl),
    },
    openGraph: {
      title: t(`${prefix}.openGraphTitle`),
      description: t(`${prefix}.openGraphDescription`),
      url: canonicalUrl,
      siteName: t("site.name"),
      type: "website",
      locale,
      alternateLocale: alternateLocales,
    },
    twitter: {
      card: "summary_large_image",
      title: t(`${prefix}.twitterTitle`),
      description: t(`${prefix}.twitterDescription`),
    },
    robots,
  };
}

export async function createSiteMetadata(locale: AppLocale): Promise<Metadata> {
  const t = await getTranslations("metadata");

  return {
    title: {
      default: t("site.title"),
      template: `%s | ${t("site.name")}`,
    },
    description: t("site.description"),
    keywords: t("site.keywords"),
    openGraph: {
      title: t("site.openGraphTitle"),
      description: t("site.openGraphDescription"),
      siteName: t("site.name"),
      type: "website",
      locale,
    },
    twitter: {
      card: "summary_large_image",
      title: t("site.twitterTitle"),
      description: t("site.twitterDescription"),
    },
  };
}
