import { fetch } from "next/dist/compiled/@edge-runtime/primitives/fetch";

export type LiveEvent = {
  name: string;
  href: string;
  date: string | null;
  location: string | null;
};

const FEI_EVENTS_URL = "https://www.fei.org/events";

export async function fetchLiveFEIEvents(): Promise<LiveEvent[]> {
  try {
    const response = await fetch(FEI_EVENTS_URL, {
      headers: { "User-Agent": "Shabdiz/1.0" },
      next: { revalidate: 900 },
    });
    if (!response.ok) return [];
    const html = await response.text();
    const events: LiveEvent[] = [];
    const seen = new Set<string>();
    const pattern = /<a[^>]+href=["']([^"']*\/events\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) && events.length < 50) {
      const href = new URL(match[1], FEI_EVENTS_URL).toString();
      const name = match[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
      if (!name || name.length < 3 || seen.has(href)) continue;
      seen.add(href);
      events.push({ name, href, date: null, location: null });
    }
    return events;
  } catch {
    return [];
  }
}
