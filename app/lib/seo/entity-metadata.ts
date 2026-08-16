import type { Metadata } from "next";
import { getSiteBaseUrl } from "@/app/lib/seo/site-url";
import { localizePath } from "@/i18n/path";
import { routing, type AppLocale } from "@/i18n/routing";
import type { BreederProfileDetail } from "@/app/types/breeder";
import type { StallionDetail } from "@/app/types/stallion";

export type EntitySeoTemplates = {
  title: string;
  description: string;
  keywords: string;
  openGraphTitle: string;
  openGraphDescription: string;
  twitterTitle: string;
  twitterDescription: string;
};

const PUBLIC_BRAND = "SHABDIZ";

function brandify(value: string): string {
  return value.replace(/EquiMaster Pro|EquiMaster/g, PUBLIC_BRAND);
}

function toAbsoluteUrl(url: string, baseUrl: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;
}

export function fillSeoTemplate(template: string, values: Record<string, string>): string {
  return brandify(template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? ""));
}

export function buildLanguageAlternates(pathname: string, baseUrl: string): Record<string, string> {
  const languages: Record<string, string> = {};

  for (const locale of routing.locales) {
    languages[locale] = `${baseUrl}${localizePath(pathname, locale)}`;
  }

  languages["x-default"] = `${baseUrl}${localizePath(pathname, routing.defaultLocale)}`;

  return languages;
}

export function buildEntityMetadata(params: {
  title: string;
  description: string;
  keywords: string;
  openGraphTitle: string;
  openGraphDescription: string;
  twitterTitle: string;
  twitterDescription: string;
  pathname: string;
  locale: AppLocale;
  siteName?: string;
  images?: string[];
  imageAlt?: string;
  robots?: Metadata["robots"];
}): Metadata {
  const baseUrl = getSiteBaseUrl();
  const canonicalPath = localizePath(params.pathname, params.locale);
  const canonicalUrl = `${baseUrl}${canonicalPath}`;
  const alternateLocales = routing.locales.filter((entry) => entry !== params.locale);
  const absoluteImages = (params.images ?? [])
    .filter(Boolean)
    .map((url) => toAbsoluteUrl(url, baseUrl));
  const siteName = PUBLIC_BRAND;

  return {
    title: brandify(params.title),
    description: brandify(params.description),
    keywords: brandify(params.keywords),
    alternates: {
      canonical: canonicalUrl,
      languages: buildLanguageAlternates(params.pathname, baseUrl),
    },
    openGraph: {
      title: brandify(params.openGraphTitle),
      description: brandify(params.openGraphDescription),
      type: "website",
      url: canonicalUrl,
      siteName,
      locale: params.locale,
      alternateLocale: alternateLocales,
      ...(absoluteImages.length > 0
        ? {
            images: absoluteImages.map((url) => ({
              url,
              alt: params.imageAlt ?? params.title,
            })),
          }
        : {}),
    },
    twitter: {
      card: absoluteImages.length > 0 ? "summary_large_image" : "summary",
      title: brandify(params.twitterTitle),
      description: brandify(params.twitterDescription),
      ...(absoluteImages.length > 0 ? { images: [absoluteImages[0]] } : {}),
    },
    robots: params.robots ?? { index: true, follow: true },
  };
}

export function buildStallionMetadata(
  stallion: StallionDetail,
  locale: AppLocale,
  siteName: string,
  templates: EntitySeoTemplates
): Metadata {
  const breeding =
    stallion.breedingMethods.length > 0 ? stallion.breedingMethods.join(", ") : stallion.discipline;
  const vars: Record<string, string> = {
    name: stallion.name,
    breed: stallion.breed,
    discipline: stallion.discipline,
    country: stallion.country,
    studFee: stallion.studFeeLabel,
    breeding,
    siteName,
  };

  const image = stallion.coverImageUrl || stallion.images[0];

  return buildEntityMetadata({
    title: fillSeoTemplate(templates.title, vars),
    description: fillSeoTemplate(templates.description, vars),
    keywords: fillSeoTemplate(templates.keywords, vars),
    openGraphTitle: fillSeoTemplate(templates.openGraphTitle, vars),
    openGraphDescription: fillSeoTemplate(templates.openGraphDescription, vars),
    twitterTitle: fillSeoTemplate(templates.twitterTitle, vars),
    twitterDescription: fillSeoTemplate(templates.twitterDescription, vars),
    pathname: `/stallions/${stallion.id}`,
    locale,
    siteName,
    images: image ? [image] : undefined,
    imageAlt: `${stallion.name} — ${stallion.breed} stallion`,
  });
}

export function buildBreederMetadata(
  breeder: BreederProfileDetail,
  locale: AppLocale,
  siteName: string,
  templates: EntitySeoTemplates
): Metadata {
  const location = breeder.city ? `${breeder.city}, ${breeder.country}` : breeder.country;
  const disciplines =
    breeder.disciplines.length > 0 ? breeder.disciplines.join(", ") : "sport horses";
  const vars: Record<string, string> = {
    name: breeder.name,
    country: breeder.country,
    city: breeder.city ?? "",
    location,
    disciplines,
    siteName,
  };

  const image = breeder.logoUrl || breeder.coverImageUrl;

  return buildEntityMetadata({
    title: fillSeoTemplate(templates.title, vars),
    description: fillSeoTemplate(templates.description, vars),
    keywords: fillSeoTemplate(templates.keywords, vars),
    openGraphTitle: fillSeoTemplate(templates.openGraphTitle, vars),
    openGraphDescription: fillSeoTemplate(templates.openGraphDescription, vars),
    twitterTitle: fillSeoTemplate(templates.twitterTitle, vars),
    twitterDescription: fillSeoTemplate(templates.twitterDescription, vars),
    pathname: `/breeders/${breeder.id}`,
    locale,
    siteName,
    images: image ? [image] : undefined,
    imageAlt: `${breeder.name} logo`,
  });
}

export function buildBreederOrganizationJsonLd(breeder: BreederProfileDetail) {
  const baseUrl = getSiteBaseUrl();
  const pageUrl = `${baseUrl}/breeders/${breeder.id}`;
  const logo = breeder.logoUrl ? toAbsoluteUrl(breeder.logoUrl, baseUrl) : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: breeder.name,
    url: pageUrl,
    ...(logo ? { logo } : {}),
    address: {
      "@type": "PostalAddress",
      addressCountry: breeder.country,
      ...(breeder.city ? { addressLocality: breeder.city } : {}),
    },
    ...(breeder.description.trim()
      ? { description: breeder.description.trim().slice(0, 500) }
      : {}),
    ...(breeder.website
      ? {
          sameAs: [
            breeder.website.startsWith("http") ? breeder.website : `https://${breeder.website}`,
          ],
        }
      : {}),
  };
}

export function loadEntitySeoTemplates(
  t: (key: string) => string,
  entityKey: "horse" | "stallion" | "breeder"
): EntitySeoTemplates {
  const prefix = `entities.${entityKey}`;

  return {
    title: t(`${prefix}.title`),
    description: t(`${prefix}.description`),
    keywords: t(`${prefix}.keywords`),
    openGraphTitle: t(`${prefix}.openGraphTitle`),
    openGraphDescription: t(`${prefix}.openGraphDescription`),
    twitterTitle: t(`${prefix}.twitterTitle`),
    twitterDescription: t(`${prefix}.twitterDescription`),
  };
}
