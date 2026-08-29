export type LiveEvent = {
  name: string;
  href: string;
  date: string | null;
  location: string | null;
  discipline: string | null;
};

const FEI_EVENTS_URL = "https://www.fei.org/events";

const COUNTRY_CODES: Record<string, string> = {
  GER: "Germany",
  FRA: "France",
  BEL: "Belgium",
  NED: "Netherlands",
  GBR: "Great Britain",
  ITA: "Italy",
  ESP: "Spain",
  USA: "United States",
  SUI: "Switzerland",
  AUT: "Austria",
  POL: "Poland",
  SWE: "Sweden",
  DEN: "Denmark",
  IRL: "Ireland",
  POR: "Portugal",
  CZE: "Czech Republic",
  NOR: "Norway",
  FIN: "Finland",
  AUS: "Australia",
  NZL: "New Zealand",
  CAN: "Canada",
  MEX: "Mexico",
};

const DISCIPLINES = [
  "Jumping",
  "Dressage",
  "Eventing",
  "Endurance",
  "Driving",
  "Vaulting",
] as const;

function cleanText(value: string) {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function inferDiscipline(context: string): string | null {
  return DISCIPLINES.find((discipline) =>
    new RegExp(`\\b${discipline}\\b`, "i").test(context)
  ) ?? null;
}

function inferCountry(context: string): string | null {
  for (const [code, name] of Object.entries(COUNTRY_CODES)) {
    if (new RegExp(`\\b${code}\\b`).test(context)) return name;
  }
  return null;
}

function inferDate(context: string): string | null {
  const match = context.match(/\b\d{1,2}\s*(?:-|–|—)\s*\d{1,2}(?:\s+[A-Z][a-z]{2,9})?\b/);
  return match?.[0] ?? null;
}

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

    while ((match = pattern.exec(html)) && events.length < 100) {
      const href = new URL(match[1], FEI_EVENTS_URL).toString();
      const name = cleanText(match[2]);
      if (!name || name.length < 3 || name.length > 180 || seen.has(href)) continue;

      const context = cleanText(html.slice(Math.max(0, match.index - 900), match.index + 1200));
      const location = inferCountry(context);
      const discipline = inferDiscipline(context);

      seen.add(href);
      events.push({
        name,
        href,
        date: inferDate(context),
        location,
        discipline,
      });
    }

    return events;
  } catch {
    return [];
  }
}
