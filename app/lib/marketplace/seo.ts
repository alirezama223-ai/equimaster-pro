import type { Metadata } from "next";
import { getListingCoverImageUrl, formatListingRowPrice } from "@/app/lib/horse-listings";
import { getSiteBaseUrl } from "@/app/lib/seo/site-url";
import {
  buildEntityMetadata,
  fillSeoTemplate,
  type EntitySeoTemplates,
} from "@/app/lib/seo/entity-metadata";
import { localizePath } from "@/i18n/path";
import { routing, type AppLocale } from "@/i18n/routing";
import { getPublicListingPath, MARKETPLACE_PATHS } from "@/app/lib/marketplace/paths";
import { buildMarketplaceSearchQuery } from "@/app/lib/marketplace/search";
import type { PublicListingProfile } from "@/app/types/marketplace-public";

const PLACEHOLDER_IMAGE = "/emi.jpg";
const META_DESCRIPTION_MAX = 160;
const META_DESCRIPTION_WORD_BREAK_FLOOR = 140;

const OPEN_GRAPH_LOCALES: Record<AppLocale, string> = {
  en: "en_US",
  de: "de_DE",
  fr: "fr_FR",
  nl: "nl_NL",
  es: "es_ES",
};

export type HorseListingSeoConfig = {
  siteName: string;
  imageAltTemplate: string;
  templates?: EntitySeoTemplates;
  priceOnRequestLabel?: string;
  genderLabels?: {
    Mare: string;
    Stallion: string;
    Gelding: string;
    unknown?: string;
  };
};

function toAbsoluteUrl(url: string, baseUrl: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;
}

function toLocalizedAbsoluteUrl(pathname: string, locale: AppLocale, baseUrl: string): string {
  return `${baseUrl}${localizePath(pathname, locale)}`;
}

function isPlaceholderImage(url: string): boolean {
  return url === PLACEHOLDER_IMAGE || url.endsWith(PLACEHOLDER_IMAGE);
}

function clampMetaDescription(text: string, maxLength = META_DESCRIPTION_MAX): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  const truncated = normalized.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace >= META_DESCRIPTION_WORD_BREAK_FLOOR) {
    return truncated.slice(0, lastSpace).replace(/[.,;:]+$/, "").trim();
  }

  return truncated.trim();
}

function localizedHorseGender(
  gender: string,
  labels?: HorseListingSeoConfig["genderLabels"]
): string {
  if (!labels) {
    return gender;
  }

  if (gender === "Mare" || gender === "Stallion" || gender === "Gelding") {
    return labels[gender];
  }

  return labels.unknown ?? gender;
}

export type HorseListingSeoLabels = {
  home: string;
  marketplace: string;
};

export function buildHorseListingMetadata(
  profile: PublicListingProfile,
  locale: AppLocale = routing.defaultLocale,
  seoConfig?: HorseListingSeoConfig
): Metadata {
  const { listing, horse, publicUrl } = profile;
  const siteName = seoConfig?.siteName ?? "EquiMaster Pro";
  const imageAltTemplate =
    seoConfig?.imageAltTemplate ?? "{name} — {discipline} sport horse for sale";
  const imageAlt = imageAltTemplate
    .replace("{name}", horse.name)
    .replace("{discipline}", horse.discipline);
  const canonicalPath = publicUrl || getPublicListingPath(horse.slug);
  const baseUrl = getSiteBaseUrl();
  const priceLabel = formatListingRowPrice(listing, seoConfig?.priceOnRequestLabel);
  const descriptionText = horse.description.trim();
  const breeder = horse.stableName ?? listing.stable_name ?? listing.seller_name;
  const gender = localizedHorseGender(horse.gender, seoConfig?.genderLabels);
  const vars: Record<string, string> = {
    name: horse.name,
    breed: horse.breed,
    gender,
    discipline: horse.discipline,
    level: horse.level,
    age: String(horse.age),
    price: priceLabel,
    country: horse.country,
    breeder,
    descriptionSnippet: "",
    siteName,
  };

  const templates = seoConfig?.templates;
  const title = templates
    ? fillSeoTemplate(templates.title, vars)
    : `${horse.name} · ${horse.discipline} · ${horse.level}`;
  const coreDescription = (
    templates
      ? fillSeoTemplate(templates.description, vars)
      : `${horse.breed} ${gender} for sale in ${horse.country}. ${priceLabel}.`
  )
    .replace(/\s+/g, " ")
    .trim();
  const snippetBudget = META_DESCRIPTION_MAX - coreDescription.length - 1;
  const descriptionSnippet =
    snippetBudget >= 20 && descriptionText.length > 0
      ? clampMetaDescription(descriptionText, snippetBudget)
      : "";
  const description = clampMetaDescription(
    descriptionSnippet ? `${coreDescription} ${descriptionSnippet}` : coreDescription
  );
  const keywords = templates
    ? fillSeoTemplate(templates.keywords, { ...vars, descriptionSnippet })
    : `${horse.name}, ${horse.breed}, ${horse.discipline}, horse for sale`;
  const openGraphDescription = templates
    ? fillSeoTemplate(templates.openGraphDescription, { ...vars, descriptionSnippet })
    : descriptionText.length > 0
      ? descriptionText.slice(0, 200)
      : description;
  const openGraphTitle = templates
    ? fillSeoTemplate(templates.openGraphTitle, vars)
    : `${horse.name} | ${siteName}`;
  const twitterTitle = templates
    ? fillSeoTemplate(templates.twitterTitle, vars)
    : `${horse.name} | ${siteName}`;
  const twitterDescription = templates
    ? fillSeoTemplate(templates.twitterDescription, { ...vars, descriptionSnippet })
    : openGraphDescription;

  const coverImage = getListingCoverImageUrl(listing);
  const galleryImages = (horse.images.length > 0 ? horse.images : listing.image_urls).filter(Boolean);
  const sourceImages = galleryImages.length > 0 ? galleryImages : coverImage ? [coverImage] : [];
  const imageUrls = sourceImages
    .filter((url) => !isPlaceholderImage(url))
    .map((url) => toAbsoluteUrl(url, baseUrl));

  const metadata = buildEntityMetadata({
    title,
    description,
    keywords,
    openGraphTitle,
    openGraphDescription,
    twitterTitle,
    twitterDescription,
    pathname: canonicalPath,
    locale,
    siteName,
    images: imageUrls.length > 0 ? imageUrls : undefined,
    imageAlt,
    robots: {
      index: listing.status === "active",
      follow: true,
    },
  });

  const openGraph = metadata.openGraph;
  if (!openGraph || Array.isArray(openGraph)) {
    return metadata;
  }

  return {
    ...metadata,
    openGraph: {
      ...openGraph,
      locale: OPEN_GRAPH_LOCALES[locale],
      alternateLocale: routing.locales
        .filter((entry) => entry !== locale)
        .map((entry) => OPEN_GRAPH_LOCALES[entry]),
    },
  };
}

export function buildHorseListingJsonLd(profile: PublicListingProfile, locale: AppLocale) {
  const { listing, horse, publicUrl, pedigreeHorse } = profile;
  const baseUrl = getSiteBaseUrl();
  const coverImage = getListingCoverImageUrl(listing);
  const images = (horse.images.length > 0 ? horse.images : listing.image_urls).filter(Boolean);
  const jsonLdImages = (images.length > 0 ? images : coverImage ? [coverImage] : [])
    .filter((url) => url !== "/emi.jpg")
    .map((url) => toAbsoluteUrl(url, baseUrl));
  const numericPrice =
    listing.price === null || listing.price === undefined ? undefined : Number(listing.price);
  const isPriced =
    !listing.price_on_request && numericPrice !== undefined && Number.isFinite(numericPrice);
  const listingPath = publicUrl || getPublicListingPath(horse.slug || listing.slug);
  const listingUrl = toLocalizedAbsoluteUrl(listingPath, locale, baseUrl);
  const color = horse.color.trim();
  const identifier = listing.slug?.trim() || listing.id;
  const additionalProperty: Array<{ "@type": "PropertyValue"; name: string; value: string | number }> =
    [
      { "@type": "PropertyValue", name: "Age", value: `${horse.age} years` },
      { "@type": "PropertyValue", name: "Height", value: `${horse.height} cm` },
      { "@type": "PropertyValue", name: "Gender", value: horse.gender },
      { "@type": "PropertyValue", name: "Level", value: horse.level },
      { "@type": "PropertyValue", name: "Country", value: horse.country },
    ];

  const sire = horse.sire.trim();
  if (sire) {
    additionalProperty.push({ "@type": "PropertyValue", name: "Sire", value: sire });
  }

  const dam = horse.dam.trim();
  if (dam) {
    additionalProperty.push({ "@type": "PropertyValue", name: "Dam", value: dam });
  }

  const damSire = (horse.damSire ?? "").trim();
  if (damSire) {
    additionalProperty.push({ "@type": "PropertyValue", name: "Dam's sire", value: damSire });
  }

  const birthYear = pedigreeHorse?.birthYear;
  if (typeof birthYear === "number" && Number.isFinite(birthYear)) {
    additionalProperty.push({ "@type": "PropertyValue", name: "Birth year", value: birthYear });
  }

  return {
    "@type": "Product",
    "@id": `${listingUrl}#product`,
    additionalType: "https://schema.org/Horse",
    name: horse.name,
    description: horse.description,
    url: listingUrl,
    identifier,
    ...(jsonLdImages.length > 0 ? { image: jsonLdImages } : {}),
    ...(color ? { color } : {}),
    category: horse.discipline,
    brand: {
      "@type": "Brand",
      name: horse.breed,
    },
    offers: {
      "@type": "Offer",
      "@id": `${listingUrl}#offer`,
      ...(isPriced
        ? {
            price: numericPrice,
            priceCurrency: "EUR",
          }
        : {}),
      availability:
        listing.status === "active"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: listingUrl,
      seller: {
        "@type": "Organization",
        name: horse.stableName ?? listing.stable_name ?? listing.seller_name,
      },
    },
    additionalProperty,
  };
}

export function buildHorseListingBreadcrumbJsonLd(
  profile: PublicListingProfile,
  labels: HorseListingSeoLabels,
  locale: AppLocale
) {
  const { horse, publicUrl } = profile;
  const baseUrl = getSiteBaseUrl();
  const listingPath = publicUrl || getPublicListingPath(horse.slug);
  const breedPath = `/horses${buildMarketplaceSearchQuery({ breed: horse.breed })}`;

  return {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: labels.home,
        item: toLocalizedAbsoluteUrl("/", locale, baseUrl),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: labels.marketplace,
        item: toLocalizedAbsoluteUrl(MARKETPLACE_PATHS.home, locale, baseUrl),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: horse.breed,
        item: toLocalizedAbsoluteUrl(breedPath, locale, baseUrl),
      },
      {
        "@type": "ListItem",
        position: 4,
        name: horse.name,
        item: toLocalizedAbsoluteUrl(listingPath, locale, baseUrl),
      },
    ],
  };
}

export function buildHorseListingStructuredData(
  profile: PublicListingProfile,
  labels: HorseListingSeoLabels,
  locale: AppLocale
) {
  const product = buildHorseListingJsonLd(profile, locale);
  const listingUrl = product.url;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ItemPage",
        "@id": `${listingUrl}#webpage`,
        url: listingUrl,
        mainEntity: {
          "@id": `${listingUrl}#product`,
        },
      },
      product,
      buildHorseListingBreadcrumbJsonLd(profile, labels, locale),
    ],
  };
}
