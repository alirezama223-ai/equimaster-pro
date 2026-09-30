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

function parseJsonArray<T>(formData: FormData, key: string): T[] {
  const raw = text(formData, key);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function normalizeSex(value: string) {
  const v = value.toLowerCase();
  if (v === "stallion" || v.includes("hengst")) return "stallion";
  if (v === "gelding" || v.includes("wallach")) return "gelding";
  if (v === "mare" || v.includes("stute")) return "mare";
  return "unknown";
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
  const extractedPedigree = parseJsonArray<any>(formData, "pedigree_json");
  const extractedVaccinations = parseJsonArray<any>(formData, "vaccinations_json");

  const sex = normalizeSex(gender || "");

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

  const pedigreeRows = extractedPedigree
    .map((item) => ({
      name: String(item?.name || "").trim(),
      sex: normalizeSex(String(item?.sex || "")),
      breed: String(item?.breed || "").trim() || null,
      registration_number: String(item?.registration_number || "").trim() || null,
      relation: String(item?.relation || "").trim().toLowerCase(),
      sire_name: String(item?.sire_name || "").trim(),
      dam_name: String(item?.dam_name || "").trim(),
    }))
    .filter((item) => item.name && item.relation !== "self");

  const byName = new Map<string, any>();
  for (const row of pedigreeRows) {
    const key = normalizedName(row.name);
    if (!byName.has(key)) byName.set(key, row);
  }

  const createdByName = new Map<string, string>();
  for (const row of byName.values()) {
    const { data: ancestor } = await supabase
      .from("pedigree_horses")
      .insert({
        name: row.name,
        normalized_name: `personal:${user.id}:${normalizedName(row.name)}:${crypto.randomUUID()}`,
        sex: row.sex,
        birth_year: null,
        breed: row.breed,
        studbook: null,
        registration_number: row.registration_number,
        color: null,
        country: null,
        created_by: user.id,
      })
      .select("id")
      .single();
    if (ancestor) createdByName.set(normalizedName(row.name), ancestor.id);
  }

  const rootSelf = extractedPedigree.find((item: any) => String(item?.relation || "").trim().toLowerCase() === "self");
  const rootSireName = String(rootSelf?.sire_name || "").trim() || pedigreeRows.find((row) => row.relation === "sire")?.name || "";
  const rootDamName = String(rootSelf?.dam_name || "").trim() || pedigreeRows.find((row) => row.relation === "dam")?.name || "";

  const rootSireId = createdByName.get(normalizedName(rootSireName));
  const rootDamId = createdByName.get(normalizedName(rootDamName));
  if (rootSireId || rootDamId) {
    await supabase.from("pedigree_horses").update({ sire_id: rootSireId ?? null, dam_id: rootDamId ?? null }).eq("id", pedigreeHorse.id).eq("created_by", user.id);
  }

  for (const row of byName.values()) {
    const ancestorId = createdByName.get(normalizedName(row.name));
    if (!ancestorId) continue;
    const sireId = createdByName.get(normalizedName(row.sire_name));
    const damId = createdByName.get(normalizedName(row.dam_name));
    if (sireId || damId) {
      await supabase.from("pedigree_horses").update({ sire_id: sireId ?? null, dam_id: damId ?? null }).eq("id", ancestorId).eq("created_by", user.id);
    }
  }

  // Keep every readable vaccination row. A passport may show only a date,
  // batch number, stamp or partial vaccine name; that is still useful record data.
  const vaccinationRows = extractedVaccinations
    .map((item) => ({
      vaccine_name: String(item?.vaccine_name || "").trim(),
      administered_date: String(item?.administered_date || "").trim(),
      next_due_date: String(item?.next_due_date || "").trim() || null,
      batch_number: String(item?.batch_number || "").trim() || null,
      notes: String(item?.notes || "").trim() || null,
    }))
    .filter((item) => item.vaccine_name || item.administered_date || item.next_due_date || item.batch_number || item.notes);

  if (vaccinationRows.length) {
    const { error: vaccinationError } = await supabase.from("horse_vaccinations").insert(vaccinationRows.map((row) => ({
      created_by: user.id,
      pedigree_horse_id: pedigreeHorse.id,
      ...row,
    })));
    if (vaccinationError) console.error("Could not save extracted vaccinations", vaccinationError);
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
    await supabase
      .from("pedigree_horses")
      .update({
        name,
        sex: normalizeSex(gender || ""),
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
