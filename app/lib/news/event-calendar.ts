export type CalendarEventInput = {
  name: string;
  date: string | null;
  location: string | null;
  description?: string | null;
  url: string;
};

export type ParsedEventDate = {
  date: Date;
  hasTime: boolean;
};

const MONTHS: Record<string, number> = {
  jan: 0,
  feb: 1,
  mar: 2,
  apr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  aug: 7,
  sep: 8,
  oct: 9,
  nov: 10,
  dec: 11,
};

function escapeIcs(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function formatUtc(date: Date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function formatDateOnly(date: Date) {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

function nextDay(date: Date) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + 1);
  return result;
}

/**
 * Parses the date formats currently exposed by the FEI feed, including
 * `29 Aug 2026`, `29 Aug`, and ranges such as `29 Aug - 31 Aug 2026`.
 * A time such as `14:30` is treated as a local-time event start.
 */
export function parseEventDate(value: string | null, now = new Date()): ParsedEventDate | null {
  if (!value) return null;
  const normalized = value.replace(/–|—/g, "-").replace(/\s+/g, " ").trim();
  const dateMatch = normalized.match(/\b(\d{1,2})\s+([A-Za-z]{3,9})(?:\s+(\d{4}))?/);
  if (!dateMatch) return null;

  const day = Number(dateMatch[1]);
  const month = MONTHS[dateMatch[2].slice(0, 3).toLowerCase()];
  if (!Number.isInteger(day) || month === undefined) return null;

  const year = Number(dateMatch[3] ?? now.getFullYear());
  const timeMatch = normalized.match(/\b(\d{1,2}):(\d{2})\b/);
  const hours = timeMatch ? Number(timeMatch[1]) : 0;
  const minutes = timeMatch ? Number(timeMatch[2]) : 0;
  if (hours > 23 || minutes > 59) return null;

  const date = new Date(year, month, day, hours, minutes, 0, 0);
  if (Number.isNaN(date.getTime()) || date.getMonth() !== month || date.getDate() !== day) return null;
  return { date, hasTime: Boolean(timeMatch) };
}

export function buildIcs(event: CalendarEventInput): string | null {
  const parsed = parseEventDate(event.date);
  if (!parsed) return null;

  const stamp = formatUtc(new Date());
  const uid = `${encodeURIComponent(event.url)}@shabdizhorse.com`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Shabdiz//News Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `SUMMARY:${escapeIcs(event.name)}`,
  ];

  if (parsed.hasTime) {
    lines.push(`DTSTART:${formatUtc(parsed.date)}`, `DTEND:${formatUtc(new Date(parsed.date.getTime() + 60 * 60 * 1000))}`);
  } else {
    lines.push(`DTSTART;VALUE=DATE:${formatDateOnly(parsed.date)}`, `DTEND;VALUE=DATE:${formatDateOnly(nextDay(parsed.date))}`);
  }

  if (event.location) lines.push(`LOCATION:${escapeIcs(event.location)}`);
  if (event.description) lines.push(`DESCRIPTION:${escapeIcs(event.description)}`);
  lines.push(`URL:${event.url}`, "END:VEVENT", "END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}

export function downloadIcs(event: CalendarEventInput) {
  const content = buildIcs(event);
  if (!content) return false;
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = `${event.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 80) || "event"}.ics`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(href);
  return true;
}
