export type Discipline = {
  /** Stable slug for future i18n keys (e.g. disciplines.show_jumping). */
  id: string;
  /** Canonical English label stored in listings and profiles. */
  label: string;
};

const DISCIPLINE_DEFINITIONS: Discipline[] = [
  { id: "barrel_racing", label: "Barrel Racing" },
  { id: "breakaway_roping", label: "Breakaway Roping" },
  { id: "breeding_stallion", label: "Breeding Stallion" },
  { id: "broodmare", label: "Broodmare" },
  { id: "circus", label: "Circus" },
  { id: "combined_driving", label: "Combined Driving" },
  { id: "cutting", label: "Cutting" },
  { id: "dressage", label: "Dressage" },
  { id: "driving", label: "Driving" },
  { id: "endurance", label: "Endurance" },
  { id: "equitation", label: "Equitation" },
  { id: "eventing", label: "Eventing" },
  { id: "flat_racing", label: "Flat Racing" },
  { id: "gaited_horses", label: "Gaited Horses" },
  { id: "harness_racing", label: "Harness Racing" },
  { id: "horseball", label: "Horseball" },
  { id: "hunter", label: "Hunter" },
  { id: "hunter_jumper", label: "Hunter Jumper" },
  { id: "icelandic", label: "Icelandic" },
  { id: "leisure", label: "Leisure" },
  { id: "military_horse", label: "Military Horse" },
  { id: "mounted_archery", label: "Mounted Archery" },
  { id: "mounted_games", label: "Mounted Games" },
  { id: "other", label: "Other" },
  { id: "pleasure_riding", label: "Pleasure Riding" },
  { id: "pole_bending", label: "Pole Bending" },
  { id: "police_horse", label: "Police Horse" },
  { id: "polo", label: "Polo" },
  { id: "ranch_riding", label: "Ranch Riding" },
  { id: "ranch_trail", label: "Ranch Trail" },
  { id: "reining", label: "Reining" },
  { id: "roping", label: "Roping" },
  { id: "show_jumping", label: "Show Jumping" },
  { id: "steeplechase", label: "Steeplechase" },
  { id: "team_penning", label: "Team Penning" },
  { id: "therapy_horse", label: "Therapy Horse" },
  { id: "trec", label: "TREC" },
  { id: "trail", label: "Trail" },
  { id: "vaulting", label: "Vaulting" },
  { id: "western_pleasure", label: "Western Pleasure" },
  { id: "working_equitation", label: "Working Equitation" },
  { id: "young_horse", label: "Young Horse" },
];

/** All recognised horse disciplines, sorted alphabetically by label. */
export const DISCIPLINES: readonly Discipline[] = [...DISCIPLINE_DEFINITIONS].sort((a, b) =>
  a.label.localeCompare(b.label)
);

export const DISCIPLINE_LABELS: readonly string[] = DISCIPLINES.map(
  (discipline) => discipline.label
);

export const DEFAULT_DISCIPLINE = "Show Jumping";

export function findDisciplineByLabel(label: string): Discipline | undefined {
  const trimmed = label.trim();
  if (!trimmed) return undefined;
  return DISCIPLINES.find((discipline) => discipline.label === trimmed);
}

export function isValidDiscipline(label: string): boolean {
  return Boolean(findDisciplineByLabel(label));
}

export function getDisciplineSelectOptions(): {
  value: string;
  label: string;
  searchText: string;
}[] {
  return DISCIPLINES.map((discipline) => ({
    value: discipline.label,
    label: discipline.label,
    searchText: discipline.label,
  }));
}
