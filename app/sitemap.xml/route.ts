import type { MetadataRoute } from "next";
import { buildPublicSitemapEntries } from "@/app/lib/seo/sitemap-data";

export const revalidate = 3600;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function toIsoLastmod(value: Date | string | undefined): string | undefined {
  if (value == null) {
    return undefined;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

function serializeAlternateLinks(languages: unknown): string[] {
  if (!languages || typeof languages !== "object") {
    return [];
  }

  return Object.entries(languages).flatMap(([hreflang, hrefLang]) => {
    if (!isNonEmptyString(hreflang) || !isNonEmptyString(hrefLang)) {
      return [];
    }

    return [
      `    <xhtml:link rel="alternate" hreflang="${escapeXml(hreflang)}" href="${escapeXml(hrefLang)}" />`,
    ];
  });
}

function serializeUrlEntry(entry: MetadataRoute.Sitemap[number]): string | undefined {
  if (!isNonEmptyString(entry.url)) {
    return undefined;
  }

  const lastmod = toIsoLastmod(entry.lastModified);
  const lines = [
    "  <url>",
    `    <loc>${escapeXml(entry.url.trim())}</loc>`,
  ];

  if (lastmod) {
    lines.push(`    <lastmod>${escapeXml(lastmod)}</lastmod>`);
  }

  lines.push(...serializeAlternateLinks(entry.alternates?.languages));
  lines.push("  </url>");

  return lines.join("\n");
}

function buildSitemapXml(entries: MetadataRoute.Sitemap): string {
  const urls = entries
    .map(serializeUrlEntry)
    .filter(isNonEmptyString)
    .join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    urls,
    "</urlset>",
  ].join("\n");
}

export async function GET() {
  let entries: MetadataRoute.Sitemap = [];

  try {
    entries = await buildPublicSitemapEntries();
  } catch {
    entries = [];
  }

  const xml = buildSitemapXml(entries);

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
