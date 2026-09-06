"use server";

import { createClient } from "@/app/lib/supabase/server";
import type { TrainingHorse } from "@/app/types/training";

const SEX_VALUES = new Set(["stallion", "mare", "gelding", "unknown"] as const);
type HorseSex = "stallion" | "mare" | "gelding" | "unknown";

type CreateTrainingHorseInput = {
  name: string;
  sex: HorseSex;
  birthYear?: number | null;
  breed?: string;
  studbook?: string;
  registrationNumber?: string;
  color?: string;
  country?: string;
};

function cleanOptional(value: string | undefined, maxLength: number): string | null {
  const cleaned = value?.trim() ?? "";
  return cleaned ? cleaned.slice(0, maxLength) : null;
}

function normalizeHorseName(name: string): string {
  return name.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

export async function createTrainingHorseAction(input: CreateTrainingHorseInput): Promise<{
  horse?: TrainingHorse;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to add a horse." };
  }

  const name = input.name.trim();
  if (!name) {
    return { error: "Horse name is required." };
  }
  if (name.length > 120) {
    return { error: "Horse name is too long." };
  }

  const sex: HorseSex = SEX_VALUES.has(input.sex) ? input.sex : "unknown";
  const birthYear = input.birthYear == null || Number.isNaN(input.birthYear) ? null : Math.trunc(input.birthYear);
  const currentYear = new Date().getFullYear();

  if (birthYear !== null && (birthYear < 1970 || birthYear > currentYear)) {
    return { error: `Birth year must be between 1970 and ${currentYear}.` };
  }

  const { data, error } = await supabase
    .from("pedigree_horses")
    .insert({
      name,
      normalized_name: normalizeHorseName(name),
      sex,
      birth_year: birthYear,
      breed: cleanOptional(input.breed, 120),
      studbook: cleanOptional(input.studbook, 120),
      registration_number: cleanOptional(input.registrationNumber, 120),
      color: cleanOptional(input.color, 80),
      country: cleanOptional(input.country, 80),
      created_by: user.id,
      verified: false,
    })
    .select("id, name, sex")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Unable to create horse." };
  }

  return {
    horse: {
      id: data.id as string,
      name: String(data.name),
      sex: String(data.sex ?? "unknown"),
      discipline: "—",
      subtitle: String(data.sex ?? "—"),
    },
  };
}
