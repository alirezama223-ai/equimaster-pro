import { buildPublicSitemapEntries } from "@/app/lib/seo/sitemap-data";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export async function GET() {
  const entries = await buildPublicSitemapEntries();

  const urls = entries
    .map((entry) => {
      const lastmod = entry.lastModified
        ? `<lastmod>${escapeXml(new Date(entry.lastModified).toISOString())}</lastmod>`
        : "";

      const alternates = entry.alternates?.languages
        ? Object.entries(entry.alternates.languages)
            .map(([hreflang, url]) => `<xhtml:link rel="alternate" hreflang="${escapeXml(hreflang)}" href="${escapeXml(url)}" />`)
            .join("")
        : "";

      return `<url><loc>${escapeXml(entry.url)}</loc>${lastmod}${alternates}</url>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
