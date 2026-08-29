export type LiveEvent = {
  name: string;
  href: string;
  date: string | null;
  location: string | null;
  discipline: string | null;
};

const FEI_EVENTS_URL = "https://www.fei.org/events";

function clean(value: string) {
  return value.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function absoluteUrl(href: string) {
  return new URL(href, FEI_EVENTS_URL).toString();
}

function extractDate(text: string): string | null {
  const match = text.match(/\b(\d{1,2})\s+([A-Za-z]{3,9})\s*(?:-|–|—)\s*(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})\b/i);
  if (match) return match[0];
  const single = text.match(/\b\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}\b/i);
  return single?.[0] ?? null;
}

function extractLocation(text: string): string | null {
  const match = text.match(/(?:Location|Venue|Place)\s*:\s*([^|•\n]{2,100})/i);
  return match?.[1]?.trim() || null;
}

function extractDiscipline(text: string): string | null {
  const disciplines = ["Jumping", "Dressage", "Eventing", "Driving", "Endurance", "Vaulting", "Para Dressage", "Para Driving"];
  const lower = text.toLowerCase();
  return disciplines.find((discipline) => lower.includes(discipline.toLowerCase())) ?? null;
}

export async function fetchLiveFEIEvents(): Promise<LiveEvent[]> {
  try {
    const response = await fetch(FEI_EVENTS_URL, {
      headers: { "User-Agent": "EquiMaster-Pro/1.0 events-feed" },
      next: { revalidate: 900 },
    });
    if (!response.ok) return [];

    const html = await response.text();
    const events: LiveEvent[] = [];
    const seen = new Set<string>();
    const pattern = /<a[^>]+href=["']([^"']*\/events\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

    let match: RegExpExecArray | null;
    while ((match = pattern.exec(html)) && events.length < 50) {
      const href = absoluteUrl(match[1]);
      if (seen.has(href)) continue;

      const anchorText = clean(match[2]);
      if (!anchorText || anchorText.length < 3) continue;

      const contextStart = Math.max(0, match.index - 700);
      const contextEnd = Math.min(html.length, pattern.lastIndex + 700);
      const context = clean(html.slice(contextStart, contextEnd));
      const combined = `${anchorText} ${context}`;

      seen.add(href);
      events.push({
        name: anchorText,
        href,
        date: extractDate(combined),
        location: extractLocation(combined),
        discipline: extractDiscipline(combined),
      });
    }

    return events;
  } catch {
    return [];
  }
}
