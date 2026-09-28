"use server";

import { createClient } from "@/app/lib/supabase/server";

function asText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function asDate(value: unknown): string | null {
  const text = asText(value);
  if (!text) return null;
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return text;
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
    try {
      const parsed = JSON.parse(extractedRaw);
      if (parsed && typeof parsed === "object") extractedData = parsed as Record<string, unknown>;
    } catch {
      return { ok: false, error: "The extracted passport data is invalid." };
    }
  }

  const { data: horse } = await supabase.from("personal_horses").select("id").eq("id", horseId).eq("owner_id", user.id).maybeSingle();
  if (!horse) return { ok: false, error: "Horse not found." };

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${user.id}/${horseId}/${crypto.randomUUID()}-${safeName}`;
  const { error: uploadError } = await supabase.storage.from("personal-horse-documents").upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
  if (uploadError) return { ok: false, error: uploadError.message };

  const { error: insertError } = await supabase.from("personal_horse_documents").insert({
    personal_horse_id: horseId,
    owner_id: user.id,
    document_type: documentType,
    file_path: path,
    original_filename: file.name,
    extraction_status: extractedData ? "review" : "pending",
    extracted_data: extractedData,
  });
  if (insertError) {
    await supabase.storage.from("personal-horse-documents").remove([path]);
    return { ok: false, error: insertError.message };
  }

  return { ok: true };
}

export async function confirmPersonalHorseExtraction(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const documentId = String(formData.get("document_id") || "");
  if (!documentId) return { ok: false, error: "Document not found." };

  const { data: document } = await supabase
    .from("personal_horse_documents")
    .select("id, personal_horse_id, extracted_data")
    .eq("id", documentId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!document) return { ok: false, error: "Document not found." };

  const extracted = (document.extracted_data ?? {}) as Record<string, unknown>;
  const horsePatch: Record<string, unknown> = {};
  const mapping: Record<string, string> = {
    name: "name",
    ueln: "ueln",
    microchip: "microchip",
    birth_date: "birth_date",
    breed: "breed",
    gender: "gender",
    color: "color",
    height_cm: "height_cm",
    country_of_birth: "country_of_birth",
    studbook: "studbook",
    passport_number: "passport_number",
  };
  for (const [source, target] of Object.entries(mapping)) {
    const value = source === "birth_date" ? asDate(extracted[source]) : asText(extracted[source]);
    if (value !== null) horsePatch[target] = value;
  }
  if (extracted.height_cm !== undefined && Number.isFinite(Number(extracted.height_cm))) horsePatch.height_cm = Math.round(Number(extracted.height_cm));

  if (Object.keys(horsePatch).length) {
    const { error } = await supabase.from("personal_horses").update(horsePatch).eq("id", document.personal_horse_id).eq("owner_id", user.id);
    if (error) return { ok: false, error: error.message };
  }

  const vaccinations = Array.isArray(extracted.vaccinations) ? extracted.vaccinations : [];
  for (const item of vaccinations) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const vaccineName = asText(row.vaccine_name ?? row.vaccine ?? row.product);
    const administeredDate = asDate(row.administered_date ?? row.date);
    if (!vaccineName || !administeredDate) continue;
    await supabase.from("horse_vaccinations").insert({
      created_by: user.id,
      pedigree_horse_id: (await supabase.from("personal_horses").select("pedigree_horse_id").eq("id", document.personal_horse_id).single()).data?.pedigree_horse_id,
      vaccine_name: vaccineName,
      administered_date: administeredDate,
      next_due_date: asDate(row.next_due_date),
      batch_number: asText(row.batch_number ?? row.batch),
      notes: asText(row.notes),
    });
  }

  const { error: statusError } = await supabase.from("personal_horse_documents").update({ extraction_status: "confirmed" }).eq("id", documentId).eq("owner_id", user.id);
  if (statusError) return { ok: false, error: statusError.message };
  return { ok: true };
}
