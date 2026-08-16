import type { Metadata } from "next";
import { getListingCoverImageUrl, formatListingRowPrice } from "@/app/lib/horse-listings";
import { getSiteBaseUrl } from "@/app/lib/seo/site-url";
import {
  buildEntityMetadata,
  fillSeoTemplate,
  type EntitySeoTemplates,
} from "@/app/lib/seo/entity-metadata";
import { routing, type AppLocale } from "@/i18n/routing";
import { getPublicListingPath, MARKETPLACE_PATHS } from "@/app/lib/marketplace/paths";
import { buildMarketplaceSearchQuery } from "@/app/lib/marketplace/search";
import type { HorseListingRow } from "@/app/types/horse-listing";

export type HorseListingSeoConfig = {
  siteName?: string;
  imageAltTemplate: string;
  templates?: EntitySeoTemplates;
};

const PUBLIC_BRAND = "SHABDIZ";

function toAbsoluteUrl(url: string, baseUrl: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;
}

export type HorseListingSeoLabels = {
  home: string;
  marketplace: string;
};

export function buildHorseListingMetadata(
  listing: HorseListingRow,
  locale: AppLocale = routing.defaultLocale,
  seoConfig?: HorseListingSeoConfig
): Metadata {
  const siteName = PUBLIC_BRAND;
  const imageAltTemplate =
    seoConfig?.imageAltTemplate ?? "{name} — {discipline} sport horse for sale";
  const imageAlt = imageAltTemplate
    .replace("{name}", listing.name)
    .replace("{discipline}", listing.discipline);
  const canonicalPath = getPublicListingPath(listing.slug);
  const baseUrl = getSiteBaseUrl();
  const priceLabel = formatListingRowPrice(listing);
  const descriptionText = listing.description.trim();
  const breeder = listing.stable_name ?? listing.seller_name;
  const vars: Record<string, string> = {
    name: listing.name,
    breed: listing.breed,
    gender: listing.gender.toLowerCase(),
    discipline: listing.discipline,
    level: listing.level,
    age: String(listing.age),
    price: priceLabel,
    country: listing.country,
    breeder,
    descriptionSnippet: descriptionText.slice(0, 160),
    siteName,
  };

  const templates = seoConfig?.templates;
  const title = templates
    ? fillSeoTemplate(templates.title, vars)
    : `${listing.name} · ${listing.discipline} · ${listing.level}`;
  const description = templates
    ? fillSeoTemplate(templates.description, vars)
    : `${listing.breed} ${listing.gender.toLowerCase()} for sale in ${listing.country}. ${priceLabel}. ${descriptionText.slice(0, 160)}`;
  const keywords = templates
    ? fillSeoTemplate(templates.keywords, vars)
    : `${listing.name}, ${listing.breed}, ${listing.discipline}, horse for sale`;
  const openGraphDescription = templates
    ? fillSeoTemplate(templates.openGraphDescription, vars)
    : descriptionText.length > 0
      ? descriptionText.slice(0, 200)
      : description;
  const openGraphTitle = templates
    ? fillSeoTemplate(templates.openGraphTitle, vars)
    : `${listing.name} | ${siteName}`;
  const twitterTitle = templates
    ? fillSeoTemplate(templates.twitterTitle, vars)
    : `${listing.name} | ${siteName}`;
  const twitterDescription = templates
    ? fillSeoTemplate(templates.twitterDescription, vars)
    : openGraphDescription;

  const coverImage = getListingCoverImageUrl(listing);
  const galleryImages = listing.image_urls.filter(Boolean);
  const imageUrls = (galleryImages.length > 0 ? galleryImages : coverImage ? [coverImage] : []).map(
    (url) => toAbsoluteUrl(url, baseUrl)
  );

  return buildEntityMetadata({
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
}

export function buildHorseListingJsonLd(listing: HorseListingRow) {
  const baseUrl = getSiteBaseUrl();
  const coverImage = getListingCoverImageUrl(listing);
  const images = listing.image_urls.filter(Boolean);
  const jsonLdImages = (images.length > 0 ? images : coverImage ? [coverImage] : [])
    .filter((url) => url !== "/emi.jpg")
    .map((url) => toAbsoluteUrl(url, baseUrl));
  const price =
    listing.price_on_request || listing.price === null ? undefined : Number(listing.price);
  const listingUrl = `${baseUrl}${getPublicListingPath(listing.slug)}`;

  return {
    "@type": "Product",
    name: listing.name,
    description: listing.description,
    ...(jsonLdImages.length > 0 ? { image: jsonLdImages } : {}),
    category: listing.discipline,
    brand: {
      "@type": "Brand",
      name: listing.breed,
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      ...(price !== undefined ? { price } : {}),
      availability:
        listing.status === "active"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: listingUrl,
      seller: {
        "@type": "Organization",
        name: listing.stable_name ?? listing.seller_name,
      },
    },
    additionalProperty: [
      { "@type": "PropertyValue", name: "Age", value: `${listing.age} years` },
      { "@type": "PropertyValue", name: "Height", value: `${listing.height} cm` },
      { "@type": "PropertyValue", name: "Gender", value: listing.gender },
      { "@type": "PropertyValue", name: "Level", value: listing.level },
      { "@type": "PropertyValue", name: "Country", value: listing.country },
    ],
  };
}

export function buildHorseListingBreadcrumbJsonLd(
  listing: HorseListingRow,
  labels: HorseListingSeoLabels
) {
  const baseUrl = getSiteBaseUrl();
  const listingPath = getPublicListingPath(listing.slug);
  const breedPath = `/horses${buildMarketplaceSearchQuery({ breed: listing.breed })}`;

  return {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: labels.home,
        item: `${baseUrl}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: labels.marketplace,
        item: `${baseUrl}${MARKETPLACE_PATHS.home}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: listing.breed,
        item: `${baseUrl}${breedPath}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: listing.name,
        item: `${baseUrl}${listingPath}`,
      },
    ],
  };
}

export function buildHorseListingStructuredData(
  listing: HorseListingRow,
  labels: HorseListingSeoLabels
) {
  return {
    "@context": "https://schema.org",
    "@graph": [buildHorseListingJsonLd(listing), buildHorseListingBreadcrumbJsonLd(listing, labels)],
  };
}
