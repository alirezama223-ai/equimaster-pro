import { buildLastThirtyDayRange, toDateOnlyString } from "@/app/lib/training/format";

export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00`);
  date.setDate(date.getDate() + days);
  return toDateOnlyString(date);
}

export function daysAgo(referenceDate: Date, days: number): string {
  const date = new Date(referenceDate);
  date.setDate(date.getDate() - days);
  return toDateOnlyString(date);
}

export function pickSessionDates(
  density: "high" | "medium" | "low",
  referenceDate: Date = new Date()
): string[] {
  const range = buildLastThirtyDayRange(referenceDate);
  const target =
    density === "high" ? 22 : density === "medium" ? 15 : 9;

  const selected = new Set<string>();

  if (density === "high") {
    for (let offset = 0; offset < 7; offset += 1) {
      selected.add(daysAgo(referenceDate, offset));
    }
    for (let offset = 8; offset < 30; offset += 2) {
      if (selected.size >= target) break;
      selected.add(daysAgo(referenceDate, offset));
    }
  } else if (density === "medium") {
    for (let offset = 0; offset < 30; offset += 2) {
      if (selected.size >= target) break;
      selected.add(daysAgo(referenceDate, offset));
    }
  } else {
    for (let offset = 1; offset < 30; offset += 3) {
      if (selected.size >= target) break;
      selected.add(daysAgo(referenceDate, offset));
    }
  }

  while (selected.size < target) {
    for (const day of range) {
      if (selected.size >= target) break;
      selected.add(day);
    }
  }

  return [...selected].sort();
}

export function genderLabel(sex: "stallion" | "mare" | "gelding"): "Stallion" | "Mare" | "Gelding" {
  if (sex === "mare") return "Mare";
  if (sex === "stallion") return "Stallion";
  return "Gelding";
}

export function pickFrom<T>(items: readonly T[], index: number): T {
  return items[index % items.length];
}
