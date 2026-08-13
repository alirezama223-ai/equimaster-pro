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
  | "sellerDashboard"
  | "inbox";

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
  "inbox",
]);

const PUBLIC_BRAND = "SHABDIZ";

/**
 * Centralizes the public brand during the rebrand transition.
 * This keeps localized SEO dictionaries backward-compatible while ensuring
 * every rendered title, description and social card uses the new brand.
 */
function brandify(value: string): string {
  return value.replace(/EquiMaster Pro|EquiMaster/g, PUBLIC_BRAND);
}

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
    title: brandify(t(`${prefix}.title`)),
    description: brandify(t(`${prefix}.description`)),
    keywords: brandify(t(`${prefix}.keywords`)),
    alternates: {
      canonical: canonicalUrl,
      languages: buildLanguageAlternates(pathname, baseUrl),
    },
    openGraph: {
      title: brandify(t(`${prefix}.openGraphTitle`)),
      description: brandify(t(`${prefix}.openGraphDescription`)),
      url: canonicalUrl,
      siteName: PUBLIC_BRAND,
      type: "website",
      locale,
      alternateLocale: alternateLocales,
    },
    twitter: {
      card: "summary_large_image",
      title: brandify(t(`${prefix}.twitterTitle`)),
      description: brandify(t(`${prefix}.twitterDescription`)),
    },
    robots,
  };
}

export async function createSiteMetadata(locale: AppLocale): Promise<Metadata> {
  const t = await getTranslations("metadata");

  return {
    title: {
      default: brandify(t("site.title")),
      template: `%s | ${PUBLIC_BRAND}`,
    },
    description: brandify(t("site.description")),
    keywords: brandify(t("site.keywords")),
    openGraph: {
      title: brandify(t("site.openGraphTitle")),
      description: brandify(t("site.openGraphDescription")),
      siteName: PUBLIC_BRAND,
      type: "website",
      locale,
    },
    twitter: {
      card: "summary_large_image",
      title: brandify(t("site.twitterTitle")),
      description: brandify(t("site.twitterDescription")),
    },
  };
}
