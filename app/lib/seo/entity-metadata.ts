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

function toAbsoluteUrl(url: string, baseUrl: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;
}

export function fillSeoTemplate(
  template: string,
  values: Record<string, string>
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
}

export function buildLanguageAlternates(
  pathname: string,
  baseUrl: string
): Record<string, string> {
  const languages: Record<string, string> = {};

  for (const locale of routing.locales) {
    languages[locale] = `${baseUrl}${localizePath(pathname, locale)}`;
  }

  languages["x-default"] = `${baseUrl}${localizePath(
    pathname,
    routing.defaultLocale
  )}`;

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
  siteName: string;
  images?: string[];
  imageAlt?: string;
  robots?: Metadata["robots"];
}): Metadata {
  const baseUrl = getSiteBaseUrl();
  const canonicalPath = localizePath(params.pathname, params.locale);
  const canonicalUrl = `${baseUrl}${canonicalPath}`;
  const alternateLocales = routing.locales.filter(
    (entry) => entry !== params.locale
  );

  const absoluteImages = (params.images ?? [])
    .filter(Boolean)
    .map((url) => toAbsoluteUrl(url, baseUrl));

  return {
    title: params.title,
    description: params.description,
    keywords: params.keywords,

    alternates: {
      canonical: canonicalUrl,
      languages: buildLanguageAlternates(params.pathname, baseUrl),
    },

    openGraph: {
      title: params.openGraphTitle,
      description: params.openGraphDescription,
      type: "website",
      url: canonicalUrl,
      siteName: params.siteName,
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
      card:
        absoluteImages.length > 0
          ? "summary_large_image"
          : "summary",
      title: params.twitterTitle,
      description: params.twitterDescription,

      ...(absoluteImages.length > 0
        ? {
            images: [absoluteImages[0]],
          }
        : {}),
    },

    robots: params.robots ?? {
      index: true,
      follow: true,
    },
  };
}

export function buildStallionMetadata(
  stallion: StallionDetail,
  locale: AppLocale,
  siteName: string,
  templates: EntitySeoTemplates
): Metadata {
  const breeding =
    stallion.breedingMethods.length > 0
      ? stallion.breedingMethods.join(", ")
      : stallion.discipline;

  const vars: Record<string, string> = {
    name: stallion.name,
    breed: stallion.breed,
    discipline: stallion.discipline,
    country: stallion.country,
    studFee: stallion.studFeeLabel,
    breeding,
    siteName,
  };

  const image =
    stallion.coverImageUrl || stallion.images[0];

  return buildEntityMetadata({
    title: fillSeoTemplate(templates.title, vars),
    description: fillSeoTemplate(templates.description, vars),
    keywords: fillSeoTemplate(templates.keywords, vars),
    openGraphTitle: fillSeoTemplate(
      templates.openGraphTitle,
      vars
    ),
    openGraphDescription: fillSeoTemplate(
      templates.openGraphDescription,
      vars
    ),
    twitterTitle: fillSeoTemplate(
      templates.twitterTitle,
      vars
    ),
    twitterDescription: fillSeoTemplate(
      templates.twitterDescription,
      vars
    ),
    pathname: `/stallions/${stallion.id}`,
    locale,
    siteName,
    images: image ? [image] : undefined,
    imageAlt: `${stallion.name} — ${stallion.breed} stallion`,
  });
}

/**
 * Schema.org structured data for a stallion profile.
 *
 * A stallion is represented as an Animal with additional
 * breeding-related information where Schema.org provides a
 * suitable property.
 */
export function buildStallionJsonLd(
  stallion: StallionDetail
) {
  const baseUrl = getSiteBaseUrl();
  const pageUrl = `${baseUrl}/stallions/${stallion.id}`;

  const imageUrls = [
    stallion.coverImageUrl,
    ...stallion.images,
  ]
    .filter(Boolean)
    .map((url) => toAbsoluteUrl(url, baseUrl));

  const description =
    stallion.description.trim() ||
    `${stallion.name} — ${stallion.breed} stallion.`;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Animal",

    name: stallion.name,
    url: pageUrl,

    ...(imageUrls.length > 0
      ? {
          image: imageUrls,
        }
      : {}),

    description: description.slice(0, 1000),

    gender: "Male",

    ...(stallion.breed
      ? {
          breed: stallion.breed,
        }
      : {}),

    ...(stallion.color
      ? {
          color: stallion.color,
        }
      : {}),

    ...(stallion.height
      ? {
          height: {
            "@type": "QuantitativeValue",
            value: stallion.height,
            unitCode: "CMT",
          },
        }
      : {}),

    ...(stallion.birthYear
      ? {
          birthDate: `${stallion.birthYear}-01-01`,
        }
      : {}),

    ...(stallion.country
      ? {
          location: {
            "@type": "Country",
            name: stallion.country,
          },
        }
      : {}),

    ...(stallion.sire
      ? {
          parent: {
            "@type": "Animal",
            name: stallion.sire,
            gender: "Male",
          },
        }
      : {}),

    ...(stallion.dam
      ? {
          additionalProperty: [
            {
              "@type": "PropertyValue",
              name: "Dam",
              value: stallion.dam,
            },
            ...(stallion.damSire
              ? [
                  {
                    "@type": "PropertyValue",
                    name: "Dam's sire",
                    value: stallion.damSire,
                  },
                ]
              : []),
          ],
        }
      : {}),

    ...(stallion.discipline
      ? {
          knowsAbout: stallion.discipline,
        }
      : {}),

    ...(stallion.competitionLevel
      ? {
          award: stallion.competitionLevel,
        }
      : {}),

    ...(stallion.breeder
      ? {
          breeder: {
            "@type": "Organization",
            name: stallion.breeder.name,
            ...(stallion.breeder.website
              ? {
                  url: stallion.breeder.website.startsWith("http")
                    ? stallion.breeder.website
                    : `https://${stallion.breeder.website}`,
                }
              : {}),
            ...(stallion.breeder.country
              ? {
                  address: {
                    "@type": "PostalAddress",
                    addressCountry:
                      stallion.breeder.country,
                    ...(stallion.breeder.city
                      ? {
                          addressLocality:
                            stallion.breeder.city,
                        }
                      : {}),
                  },
                }
              : {}),
          },
        }
      : {}),

        ...(stallion.availability
      ? {
          additionalProperty: [
            {
              "@type": "PropertyValue",
              name: "Availability",
              value: stallion.availability,
            },
          ],
        }
      : {}),
  };

  return jsonLd;
}

export function buildBreederMetadata(
  breeder: BreederProfileDetail,
  locale: AppLocale,
  siteName: string,
  templates: EntitySeoTemplates
): Metadata {
  const location = breeder.city
    ? `${breeder.city}, ${breeder.country}`
    : breeder.country;

  const disciplines =
    breeder.disciplines.length > 0
      ? breeder.disciplines.join(", ")
      : "sport horses";

  const vars: Record<string, string> = {
    name: breeder.name,
    country: breeder.country,
    city: breeder.city ?? "",
    location,
    disciplines,
    siteName,
  };

  const image =
    breeder.logoUrl || breeder.coverImageUrl;

  return buildEntityMetadata({
    title: fillSeoTemplate(templates.title, vars),
    description: fillSeoTemplate(
      templates.description,
      vars
    ),
    keywords: fillSeoTemplate(templates.keywords, vars),
    openGraphTitle: fillSeoTemplate(
      templates.openGraphTitle,
      vars
    ),
    openGraphDescription: fillSeoTemplate(
      templates.openGraphDescription,
      vars
    ),
    twitterTitle: fillSeoTemplate(
      templates.twitterTitle,
      vars
    ),
    twitterDescription: fillSeoTemplate(
      templates.twitterDescription,
      vars
    ),
    pathname: `/breeders/${breeder.id}`,
    locale,
    siteName,
    images: image ? [image] : undefined,
    imageAlt: `${breeder.name} logo`,
  });
}

export function buildBreederOrganizationJsonLd(
  breeder: BreederProfileDetail
) {
  const baseUrl = getSiteBaseUrl();
  const pageUrl = `${baseUrl}/breeders/${breeder.id}`;

  const logo = breeder.logoUrl
    ? toAbsoluteUrl(breeder.logoUrl, baseUrl)
    : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: breeder.name,
    url: pageUrl,

    ...(logo ? { logo } : {}),

    address: {
      "@type": "PostalAddress",
      addressCountry: breeder.country,

      ...(breeder.city
        ? {
            addressLocality: breeder.city,
          }
        : {}),
    },

    ...(breeder.description.trim()
      ? {
          description:
            breeder.description.trim().slice(0, 500),
        }
      : {}),

    ...(breeder.website
      ? {
          sameAs: [
            breeder.website.startsWith("http")
              ? breeder.website
              : `https://${breeder.website}`,
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
    openGraphTitle: t(
      `${prefix}.openGraphTitle`
    ),
    openGraphDescription: t(
      `${prefix}.openGraphDescription`
    ),
    twitterTitle: t(
      `${prefix}.twitterTitle`
    ),
    twitterDescription: t(
      `${prefix}.twitterDescription`
    ),
  };
}
