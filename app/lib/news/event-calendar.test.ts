import { describe, expect, it } from "vitest";
import { buildIcs, parseEventDate } from "./event-calendar";

describe("event calendar", () => {
  it("parses date-only FEI labels without timezone drift", () => {
    const parsed = parseEventDate("29 Aug 2026", new Date("2026-01-01T12:00:00Z"));
    expect(parsed?.hasTime).toBe(false);
    expect(parsed?.date.toISOString()).toBe("2026-08-29T00:00:00.000Z");
  });

  it("exports date-only events as RFC 5545 all-day entries", () => {
    const ics = buildIcs({
      name: "Berlin Masters",
      date: "29 Aug 2026",
      location: "Germany",
      description: "Shabdiz event",
      url: "https://www.fei.org/events/berlin-masters",
    });
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("DTSTART;VALUE=DATE:20260829");
    expect(ics).toContain("DTEND;VALUE=DATE:20260830");
    expect(ics).toContain("SUMMARY:Berlin Masters");
    expect(ics).toContain("LOCATION:Germany");
    expect(ics).toContain("URL:https://www.fei.org/events/berlin-masters");
  });

  it("exports a timed event when a reliable start time is present", () => {
    const ics = buildIcs({
      name: "Final",
      date: "29 Aug 2026 14:30",
      location: "Aachen",
      url: "https://www.fei.org/events/final",
    });
    expect(ics).toContain("DTSTART:");
    expect(ics).not.toContain("VALUE=DATE");
  });

  it("returns null when no reliable date is available", () => {
    expect(buildIcs({ name: "Unknown", date: null, location: null, url: "https://example.com" })).toBeNull();
  });
});
