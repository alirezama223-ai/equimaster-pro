export type LiveNewsItem = {
  title: string;
  href: string;
  publishedAt: string | null;
  source: string;
  category: string;
};

type NewsSource = {
  name: string;
  url: string;
  category: string;
  pathPattern: RegExp;
  baseUrl: string;
};

const SOURCES: NewsSource[] = [
  {
    name: "FEI",
    url: "https://www.fei.org/stories/sport",
    category: "FEI News",
    pathPattern: /\/stories\/sport\//i,
    baseUrl: "https://www.fei.org",
  },
  {
    name: "FEI Jumping",
    url: "https://www.fei.org/stories/sport/jumping",
    category: "Jumping",
    pathPattern: /\/stories\/sport\/jumping\//i,
    baseUrl: "https://www.fei.org",
  },
  {
    name: "FEI Dressage",
    url: "https://www.fei.org/stories/sport/dressage",
    category: "Dressage",
    pathPattern: /\/stories\/sport\/dressage\//i,
    baseUrl: "https://www.fei.org",
  },
  {
    name: "FEI Eventing",
    url: "https://www.fei.org/stories/sport/eventing",
    category: "Eventing",
    pathPattern: /\/stories\/sport\/eventing\//i,
    baseUrl: "https://www.fei.org",
  },
  {
    name: "FEI Driving",
    url: "https://www.fei.org/stories/sport/driving",
    category: "Driving",
    pathPattern: /\/stories\/sport\/driving\//i,
    baseUrl: "https://www.fei.org",
  },
  {
    name: "FEI Endurance",
    url: "https://www.fei.org/stories/sport/endurance",
    category: "Endurance",
    pathPattern: /\/stories\/sport\/endurance\//i,
    baseUrl: "https://www.fei.org",
  },
  {
    name: "FEI Vaulting",
    url: "https://www.fei.org/stories/sport/vaulting",
    category: "Vaulting",
    pathPattern: /\/stories\/sport\/vaulting\//i,
    baseUrl: "https://www.fei.org",
  },
  {
    name: "World of Showjumping",
    url: "https://www.worldofshowjumping.com/en/News.html",
    category: "Jumping",
    pathPattern: /\/en\/(News|Events)\//i,
    baseUrl: "https://www.worldofshowjumping.com",
  },
];

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x27;/gi, "'")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function parseSource(html: string, source: NewsSource): LiveNewsItem[] {
  const items: LiveNewsItem[] = [];
  const seen = new Set<string>();
  const linkPattern = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  let match: RegExpExecArray | null;
  while ((match = linkPattern.exec(html)) && items.length < 12) {
    const href = match[1];
    const title = decodeHtml(match[2]).replace(/\s+/g, " ");
    if (!title || title.length < 18 || title.length > 180) continue;
    if (!source.pathPattern.test(href)) continue;
    if (/read more|discover more|see more|home|login|instagram/i.test(title)) continue;

    const absoluteHref = href.startsWith("http")
      ? href
      : new URL(href, source.baseUrl).toString();
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

  const items = responses.flatMap((result) =>
    result.status === "fulfilled" ? result.value : []
  );
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  }).slice(0, 24);
}
