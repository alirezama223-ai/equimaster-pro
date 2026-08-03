import type { MetadataRoute } from "next";
import { buildPublicSitemapEntries } from "@/app/lib/seo/sitemap-data";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildPublicSitemapEntries();
}
