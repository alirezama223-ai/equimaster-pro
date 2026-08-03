import type { MetadataRoute } from "next";
import { buildDisallowedPaths } from "@/app/lib/seo/robots-rules";
import { getSiteBaseUrl } from "@/app/lib/seo/site-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteBaseUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: buildDisallowedPaths(),
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
