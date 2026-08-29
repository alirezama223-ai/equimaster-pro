export type LiveNewsItem = {
  title: string;
  href: string;
  publishedAt: string | null;
  source: string;
  category: string;
};

const SOURCES = [
  {
    name: "World of Showjumping",
    url: "https://www.worldofshowjumping.com/en/News.html",
    category: "Jumping",
  },
] as const;

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function parseSource(html: string, source: (typeof SOURCES)[number]): LiveNewsItem[] {
  const items: LiveNewsItem[] = [];
  const seen = new Set<string>();
  const linkPattern = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let match: RegExpExecArray | null;
  while ((match = linkPattern.exec(html)) && items.length < 12) {
    const href = match[1];
    const title = decodeHtml(match[2]).replace(/\s+/g, " ");
    if (!title || title.length < 18 || title.length > 180) continue;
    if (!/\/en\/(News|Events)\//i.test(href)) continue;
    if (/read more|discover more|home|login/i.test(title)) continue;

    const absoluteHref = href.startsWith("http")
      ? href
      : new URL(href, "https://www.worldofshowjumping.com").toString();
    if (seen.has(absoluteHref)) continue;
    seen.add(absoluteHref);

    items.push({
      title,
      href: absoluteHref,
      publishedAt: null,
      source: source.name,
      category: source.category,
    });
  }

  return items;
}

export async function fetchLiveNews(): Promise<LiveNewsItem[]> {
  const responses = await Promise.allSettled(
    SOURCES.map(async (source) => {
      const response = await fetch(source.url, {
        headers: { "User-Agent": "EquiMaster-Pro/1.0 news-feed" },
        next: { revalidate: 900 },
      });
      if (!response.ok) throw new Error(`News source returned ${response.status}`);
      return parseSource(await response.text(), source);
    })
  );

  return responses.flatMap((result) => (result.status === "fulfilled" ? result.value : []));
}
