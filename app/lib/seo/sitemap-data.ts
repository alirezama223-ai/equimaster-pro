import type { MetadataRoute } from "next";
import { createClient } from "@/app/lib/supabase/server";
import { getPublicListingPath } from "@/app/lib/marketplace/paths";
import { localizePath } from "@/i18n/path";
import { routing } from "@/i18n/routing";
import { getSiteBaseUrl } from "@/app/lib/seo/site-url";

/** Public indexable routes (locale-neutral paths). */
export const STATIC_PUBLIC_PATHS = [
  "/",
  "/about",
  "/marketplace",
  "/horses",
  "/stallions",
  "/breeders",
  "/bloodlines",
  "/breeding-lab",
  "/breeding-recommendations",
] as const;

function buildLanguageAlternates(pathname: string, baseUrl: string): Record<string, string> {
  const languages: Record<string, string> = {};

  for (const locale of routing.locales) {
    languages[locale] = `${baseUrl}${localizePath(pathname, locale)}`;
  }

  languages["x-default"] = `${baseUrl}${localizePath(pathname, routing.defaultLocale)}`;

  return languages;
}

function buildSitemapEntry(
  pathname: string,
  lastModified?: Date | string | null
): MetadataRoute.Sitemap[number] {
  const baseUrl = getSiteBaseUrl();
  const canonicalPath = localizePath(pathname, routing.defaultLocale);

  return {
    url: `${baseUrl}${canonicalPath}`,
    ...(lastModified ? { lastModified: lastModified instanceof Date ? lastModified : new Date(lastModified) } : {}),
    alternates: {
      languages: buildLanguageAlternates(pathname, baseUrl),
    },
  };
}

export async function buildPublicSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const staticEntries = STATIC_PUBLIC_PATHS.map((path) => buildSitemapEntry(path));

  let dynamicEntries: MetadataRoute.Sitemap = [];

  try {
    const supabase = await createClient();

    const [listingsResult, stallionsResult, breedersResult, pedigreeResult] = await Promise.all([
      supabase
        .from("horse_listings")
        .select("slug, updated_at")
        .eq("status", "active")
        .not("slug", "is", null),
      supabase.from("stallions").select("id, updated_at").eq("status", "active"),
      supabase.from("breeders").select("id, updated_at").eq("status", "active"),
      supabase.from("pedigree_horses").select("id, updated_at"),
    ]);

    if (listingsResult.data) {
      dynamicEntries = dynamicEntries.concat(
        listingsResult.data
          .filter((row) => row.slug?.trim())
          .map((row) => buildSitemapEntry(getPublicListingPath(row.slug!), row.updated_at))
      );
    }

    if (stallionsResult.data) {
      dynamicEntries = dynamicEntries.concat(
        stallionsResult.data.map((row) => buildSitemapEntry(`/stallions/${row.id}`, row.updated_at))
      );
    }

    if (breedersResult.data) {
      dynamicEntries = dynamicEntries.concat(
        breedersResult.data.map((row) => buildSitemapEntry(`/breeders/${row.id}`, row.updated_at))
      );
    }

    if (pedigreeResult.data) {
      dynamicEntries = dynamicEntries.concat(
        pedigreeResult.data.map((row) => buildSitemapEntry(`/pedigree/${row.id}`, row.updated_at))
      );
    }
  } catch {
    // Supabase unavailable at build time — static entries still ship.
  }

  return [...staticEntries, ...dynamicEntries];
}
