"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/app/lib/supabase/server";

function text(formData: FormData, key: string) {
  return String(formData.get(key) || "").trim();
}

function optionalDate(value: string) {
  return value || null;
}

function optionalInt(value: string) {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizedName(name: string) {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

export async function createPersonalHorse(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/account");

  const name = text(formData, "name");
  if (!name) return;

  const birthDate = optionalDate(text(formData, "birth_date"));
  const breed = text(formData, "breed") || null;
  const gender = text(formData, "gender") || null;
  const color = text(formData, "color") || null;
  const country = text(formData, "country_of_birth") || null;
  const studbook = text(formData, "studbook") || null;
  const ueln = text(formData, "ueln") || null;
  const microchip = text(formData, "microchip") || null;
  const passportNumber = text(formData, "passport_number") || null;
  const heightCm = optionalInt(text(formData, "height_cm"));
  const notes = text(formData, "notes") || null;

  const sex = gender?.toLowerCase() === "stallion"
    ? "stallion"
    : gender?.toLowerCase() === "gelding"
      ? "gelding"
      : gender?.toLowerCase() === "mare"
        ? "mare"
        : "unknown";

  const { data: pedigreeHorse, error: pedigreeError } = await supabase
    .from("pedigree_horses")
    .insert({
      name,
      normalized_name: `personal:${user.id}:${normalizedName(name)}:${crypto.randomUUID()}`,
      sex,
      birth_year: birthDate ? Number.parseInt(birthDate.slice(0, 4), 10) : null,
      breed,
      studbook,
      registration_number: ueln,
      color,
      country,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (pedigreeError || !pedigreeHorse) return;

  const { data: horse, error: horseError } = await supabase
    .from("personal_horses")
    .insert({
      owner_id: user.id,
      pedigree_horse_id: pedigreeHorse.id,
      name,
      ueln,
      microchip,
      birth_date: birthDate,
      breed,
      gender,
      color,
      height_cm: heightCm,
      country_of_birth: country,
      studbook,
      passport_number: passportNumber,
      notes,
    })
    .select("id")
    .single();

  if (horseError || !horse) {
    await supabase.from("pedigree_horses").delete().eq("id", pedigreeHorse.id).eq("created_by", user.id);
    return;
  }

  revalidatePath("/account");
  revalidatePath("/account/my-horses");
  redirect(`/account/my-horses/${horse.id}`);
}

export async function updatePersonalHorse(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/account");

  const horseId = text(formData, "horse_id");
  if (!horseId) return;

  const { data: horse } = await supabase
    .from("personal_horses")
    .select("id,pedigree_horse_id")
    .eq("id", horseId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!horse) return;

  const name = text(formData, "name");
  if (!name) return;

  const birthDate = optionalDate(text(formData, "birth_date"));
  const breed = text(formData, "breed") || null;
  const gender = text(formData, "gender") || null;
  const color = text(formData, "color") || null;
  const country = text(formData, "country_of_birth") || null;
  const studbook = text(formData, "studbook") || null;
  const ueln = text(formData, "ueln") || null;
  const microchip = text(formData, "microchip") || null;
  const passportNumber = text(formData, "passport_number") || null;
  const heightCm = optionalInt(text(formData, "height_cm"));
  const notes = text(formData, "notes") || null;

  const { error } = await supabase
    .from("personal_horses")
    .update({
      name,
      ueln,
      microchip,
      birth_date: birthDate,
      breed,
      gender,
      color,
      height_cm: heightCm,
      country_of_birth: country,
      studbook,
      passport_number: passportNumber,
      notes,
    })
    .eq("id", horseId)
    .eq("owner_id", user.id);

  if (error) return;

  if (horse.pedigree_horse_id) {
    const sex = gender?.toLowerCase() === "stallion"
      ? "stallion"
      : gender?.toLowerCase() === "gelding"
        ? "gelding"
        : gender?.toLowerCase() === "mare"
          ? "mare"
          : "unknown";
    await supabase
      .from("pedigree_horses")
      .update({
        name,
        sex,
        birth_year: birthDate ? Number.parseInt(birthDate.slice(0, 4), 10) : null,
        breed,
        studbook,
        registration_number: ueln,
        color,
        country,
      })
      .eq("id", horse.pedigree_horse_id)
      .eq("created_by", user.id);
  }

  revalidatePath(`/account/my-horses/${horseId}`);
  revalidatePath("/account/my-horses");
  revalidatePath("/account");
}
