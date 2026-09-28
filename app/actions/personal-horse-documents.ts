"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/app/lib/supabase/server";

function asText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text || null;
}

function asDate(value: unknown): string | null {
  const text = asText(value);
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const de = text.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return de ? `${de[3]}-${de[2]}-${de[1]}` : null;
}

export async function uploadPersonalHorseDocument(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };
  const horseId = String(formData.get("horse_id") || "");
  const documentType = String(formData.get("document_type") || "passport");
  const extractedRaw = String(formData.get("extracted_data") || "");
  const file = formData.get("file");
  if (!horseId || !(file instanceof File) || file.size === 0) return { ok: false, error: "Please choose a document." };
  if (file.size > 20 * 1024 * 1024) return { ok: false, error: "Maximum file size is 20 MB." };
  let extractedData: Record<string, unknown> | null = null;
  if (extractedRaw) {
    try { const parsed = JSON.parse(extractedRaw); if (parsed && typeof parsed === "object") extractedData = parsed as Record<string, unknown>; }
    catch { return { ok: false, error: "The extracted passport data is invalid." }; }
  }
  const { data: horse } = await supabase.from("personal_horses").select("id").eq("id", horseId).eq("owner_id", user.id).maybeSingle();
  if (!horse) return { ok: false, error: "Horse not found." };
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/${horseId}/${crypto.randomUUID()}-${safeName}`;
  const { error: uploadError } = await supabase.storage.from("personal-horse-documents").upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
  if (uploadError) return { ok: false, error: uploadError.message };
  const { data: document, error: insertError } = await supabase.from("personal_horse_documents").insert({ personal_horse_id: horseId, owner_id: user.id, document_type: documentType, file_path: path, original_filename: file.name, extraction_status: extractedData ? "review" : "pending", extracted_data: extractedData }).select("id").single();
  if (insertError) { await supabase.storage.from("personal-horse-documents").remove([path]); return { ok: false, error: insertError.message }; }
  return { ok: true, documentId: document.id };
}

export async function confirmPersonalHorseExtraction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };
  const documentId = String(formData.get("document_id") || "");
  if (!documentId) return { ok: false, error: "Document not found." };
  const { data: document } = await supabase.from("personal_horse_documents").select("id, personal_horse_id, extracted_data").eq("id", documentId).eq("owner_id", user.id).maybeSingle();
  if (!document) return { ok: false, error: "Document not found." };
  const extracted = (document.extracted_data ?? {}) as Record<string, unknown>;
  const horsePatch: Record<string, unknown> = {};
  const mapping: Record<string, string> = { name: "name", ueln: "ueln", microchip: "microchip", birth_date: "birth_date", breed: "breed", color: "color", country_of_birth: "country_of_birth", studbook: "studbook", passport_number: "passport_number" };
  for (const [source, target] of Object.entries(mapping)) { const value = source === "birth_date" ? asDate(extracted[source]) : asText(extracted[source]); if (value !== null) horsePatch[target] = value; }
  const gender = asText(extracted.gender ?? extracted.sex);
  if (gender) horsePatch.gender = gender;
  if (extracted.height_cm !== undefined && Number.isFinite(Number(extracted.height_cm))) horsePatch.height_cm = Math.round(Number(extracted.height_cm));
  if (Object.keys(horsePatch).length) {
    const { error } = await supabase.from("personal_horses").update(horsePatch).eq("id", document.personal_horse_id).eq("owner_id", user.id);
    if (error) return { ok: false, error: error.message };
  }
  const { data: personalHorse } = await supabase.from("personal_horses").select("pedigree_horse_id").eq("id", document.personal_horse_id).eq("owner_id", user.id).single();
  const pedigreeHorseId = personalHorse?.pedigree_horse_id;
  if (pedigreeHorseId) {
    const { data: current } = await supabase.from("pedigree_horses").select("sire_id, dam_id").eq("id", pedigreeHorseId).single();
    const pedigreePatch: Record<string, unknown> = {};
    if (asText(extracted.sire)) { const { data: sire } = await supabase.from("pedigree_horses").upsert({ name: asText(extracted.sire), normalized_name: asText(extracted.sire)?.toLowerCase(), sex: "stallion", created_by: user.id }, { onConflict: "normalized_name" }).select("id").single(); if (sire) pedigreePatch.sire_id = sire.id; }
    if (asText(extracted.dam)) { const { data: dam } = await supabase.from("pedigree_horses").upsert({ name: asText(extracted.dam), normalized_name: asText(extracted.dam)?.toLowerCase(), sex: "mare", created_by: user.id }, { onConflict: "normalized_name" }).select("id").single(); if (dam) { pedigreePatch.dam_id = dam.id; if (asText(extracted.dam_sire)) { const { data: ds } = await supabase.from("pedigree_horses").upsert({ name: asText(extracted.dam_sire), normalized_name: asText(extracted.dam_sire)?.toLowerCase(), sex: "stallion", created_by: user.id }, { onConflict: "normalized_name" }).select("id").single(); if (ds) await supabase.from("pedigree_horses").update({ sire_id: ds.id }).eq("id", dam.id); } } }
    if (Object.keys(pedigreePatch).length) { const { error } = await supabase.from("pedigree_horses").update(pedigreePatch).eq("id", pedigreeHorseId); if (error) return { ok: false, error: error.message }; }
    void current;
  }
  if (pedigreeHorseId && Array.isArray(extracted.vaccinations)) {
    for (const item of extracted.vaccinations) {
      if (!item || typeof item !== "object") continue;
      const row = item as Record<string, unknown>;
      const vaccineName = asText(row.vaccine_name ?? row.vaccine ?? row.product);
      const administeredDate = asDate(row.administered_date ?? row.date);
      if (!vaccineName || !administeredDate) continue;
      await supabase.from("horse_vaccinations").insert({ created_by: user.id, pedigree_horse_id: pedigreeHorseId, vaccine_name: vaccineName, administered_date: administeredDate, next_due_date: asDate(row.next_due_date), batch_number: asText(row.batch_number ?? row.batch), notes: asText(row.notes) });
    }
  }
  const { error: statusError } = await supabase.from("personal_horse_documents").update({ extraction_status: "confirmed" }).eq("id", documentId).eq("owner_id", user.id);
  if (statusError) return { ok: false, error: statusError.message };
  revalidatePath(`/account/my-horses/my-horse`);
  return { ok: true };
}
