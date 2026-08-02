import type { DemoHorseTemplate } from "@/app/types/demo";

export const DEMO_ORGANIZATION_SLUG = "equimaster-demo-stable";

export const DEMO_HORSE_TEMPLATES: DemoHorseTemplate[] = [
  {
    name: "Atlas",
    sex: "gelding",
    breed: "KWPN",
    discipline: "Show Jumping",
    level: "1.30m",
    color: "Bay",
    country: "Netherlands",
    age: 9,
    height: 168,
    description:
      "Scopey show jumper with a rich training history—ideal for exploring analytics, workload alerts, and exercise frequency charts.",
    sessionDensity: "high",
    primary: true,
    healthProfile: "workload",
  },
  {
    name: "Bella",
    sex: "mare",
    breed: "Hanoverian",
    discipline: "Dressage",
    level: "Grand Prix",
    color: "Black",
    country: "Germany",
    age: 11,
    height: 165,
    description:
      "Consistent dressage mare with steady session rhythm and positive rule-engine insights.",
    sessionDensity: "medium",
    healthProfile: "healthy",
  },
  {
    name: "Comet",
    sex: "gelding",
    breed: "Irish Sport Horse",
    discipline: "Eventing",
    level: "CCI2*",
    color: "Grey",
    country: "Ireland",
    age: 10,
    height: 166,
    description:
      "Eventing partner showing early fatigue signals and a recovering soft-tissue injury.",
    sessionDensity: "medium",
    healthProfile: "lameness",
  },
  {
    name: "Dawn",
    sex: "mare",
    breed: "Thoroughbred",
    discipline: "Hunter",
    level: "3'6\"",
    color: "Chestnut",
    country: "United States",
    age: 8,
    height: 163,
    description:
      "Hunter mare with lighter session volume and lower readiness scores for comparison.",
    sessionDensity: "low",
    healthProfile: "recovery",
  },
  {
    name: "Echo",
    sex: "gelding",
    breed: "Holsteiner",
    discipline: "Show Jumping",
    level: "1.20m",
    color: "Dark Bay",
    country: "Germany",
    age: 12,
    height: 170,
    description:
      "Demonstrates health alerts: overdue farrier and vaccination plus an active mild injury.",
    sessionDensity: "medium",
    healthProfile: "overdue_care",
  },
];

export const DEMO_PLAN_NAMES: Record<string, string> = {
  "Show Jumping": "Competition Preparation Block",
  Dressage: "Rhythm & Suppleness Cycle",
  Eventing: "Cross-Country Fitness Plan",
  Hunter: "Steady Hunter Flatwork",
};

export const SESSION_DENSITY_TARGETS = {
  high: 22,
  medium: 15,
  low: 9,
} as const;

export const DEMO_FEELINGS = {
  positive: ["Relaxed", "Focused", "Energetic", "Strong"] as const,
  fatigue: ["Tired", "Flat", "Tense"] as const,
  mixed: ["Relaxed", "Focused", "Tired", "Strong", "Flat"] as const,
};
