/** Maps stored level values to sell.sportInfo.levels message keys. */
export const LEVEL_I18N_KEY: Record<string, string> = {
  "Young Horse / Unbroken": "youngHorseUnbroken",
  Training: "training",
  Introductory: "introductory",
  Novice: "novice",
  Elementary: "elementary",
  Medium: "medium",
  Advanced: "advanced",
  "Grand Prix": "grandPrix",
  "1.00 m": "jump100",
  "1.10 m": "jump110",
  "1.20 m": "jump120",
  "1.30 m": "jump130",
  "1.40 m": "jump140",
  "1.45 m": "jump145",
  "1.50 m+": "jump150Plus",
  "International / Grand Prix": "internationalGrandPrix",
  "Competition Ready": "competitionReady",
  Professional: "professional",
};

export const GENERAL_LEVELS = [
  "Training",
  "Competition Ready",
  "Advanced",
  "Professional",
] as const;
