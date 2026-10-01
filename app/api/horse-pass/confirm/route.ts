import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/app/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_BYTES = 40 * 1024 * 1024;
const MAX_FILES = 10;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function cleanString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function cleanNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function cleanDate(value: unknown) {
  const text = cleanString(value);
  return text && /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function cleanVaccinations(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((row) => {
    if (!row || typeof row !== "object") return null;
    const item = row as Record<string, unknown>;
    const vaccineName = cleanString(item.vaccine_name ?? item.product ?? item.vaccine ?? item.name);
    const administeredDate = cleanDate(item.administered_date ?? item.date ?? item.vaccination_date);
    const nextDueDate = cleanDate(item.next_due_date ?? item.next_due ?? item.due_date);
    const batchNumber = cleanString(item.batch_number ?? item.batch ?? item.lot);
    const notes = cleanString(item.notes ?? item.note ?? item.vet);
    if (!vaccineName && !administeredDate && !nextDueDate && !batchNumber && !notes) return null;
    return { vaccineName, administeredDate, nextDueDate, batchNumber, notes };
  }).filter(Boolean) as Array<{ vaccineName: string | null; administeredDate: string | null; nextDueDate: string | null; batchNumber: string | null; notes: string | null }>;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  const formData = await request.formData();
  const horseId = cleanString(formData.get("horse_id"));
  const rawExtracted = cleanString(formData.get("extracted_data"));
  const files = formData.getAll("file").filter((value): value is File => value instanceof File);
  if (!horseId || !rawExtracted || files.length === 0) return NextResponse.json({ error: "Horse, extracted data and passport pages are required." }, { status: 400 });
  if (files.length > MAX_FILES) return NextResponse.json({ error: `Please upload no more than ${MAX_FILES} passport pages.` }, { status: 400 });

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > MAX_TOTAL_BYTES) return NextResponse.json({ error: "The combined image size is too large. Maximum is 40 MB." }, { status: 413 });
  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type) || file.size > MAX_FILE_BYTES) return NextResponse.json({ error: "Use JPG, PNG or WebP images up to 10 MB each." }, { status: 400 });
  }

  let extracted: Record<string, unknown>;
  try {
    const parsed = JSON.parse(rawExtracted);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid");
    extracted = parsed as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "The extracted data is invalid." }, { status: 400 });
  }

  const { data: horse } = await supabase.from("personal_horses").select("id,pedigree_horse_id").eq("id", horseId).eq("owner_id", user.id).maybeSingle();
  if (!horse) return NextResponse.json({ error: "Horse not found." }, { status: 404 });

  const updates = {
    name: cleanString(extracted.name),
    birth_date: cleanDate(extracted.birth_date),
    breed: cleanString(extracted.breed),
    gender: cleanString(extracted.sex),
    color: cleanString(extracted.color),
    height_cm: cleanNumber(extracted.height_cm),
    country_of_birth: cleanString(extracted.country),
    ueln: cleanString(extracted.ueln),
    microchip: cleanString(extracted.microchip),
    passport_number: cleanString(extracted.registration_number),
  };
  const filteredUpdates = Object.fromEntries(Object.entries(updates).filter(([, value]) => value !== null));
  if (Object.keys(filteredUpdates).length > 0) {
    const { error } = await supabase.from("personal_horses").update(filteredUpdates).eq("id", horse.id).eq("owner_id", user.id);
    if (error) return NextResponse.json({ error: "The passport was read, but the horse profile could not be updated." }, { status: 500 });
  }

  if (horse.pedigree_horse_id) {
    const pedigreeUpdates = {
      name: cleanString(extracted.name),
      breed: cleanString(extracted.breed),
      sex: cleanString(extracted.sex)?.toLowerCase() ?? null,
      color: cleanString(extracted.color),
      country: cleanString(extracted.country),
      registration_number: cleanString(extracted.registration_number),
    };
    const filteredPedigree = Object.fromEntries(Object.entries(pedigreeUpdates).filter(([, value]) => value !== null));
    if (Object.keys(filteredPedigree).length > 0) await supabase.from("pedigree_horses").update(filteredPedigree).eq("id", horse.pedigree_horse_id).eq("created_by", user.id);
  }

  const vaccinations = cleanVaccinations(extracted.vaccinations ?? extracted.vaccination_records);
  if (horse.pedigree_horse_id && vaccinations.length) {
    const { data: existing } = await supabase.from("horse_vaccinations").select("administered_date,vaccine_name,batch_number").eq("created_by", user.id).eq("pedigree_horse_id", horse.pedigree_horse_id);
    const existingKeys = new Set((existing ?? []).map((row: any) => `${row.administered_date ?? ""}|${String(row.vaccine_name ?? "").trim().toLowerCase()}|${row.batch_number ?? ""}`));
    const rows = vaccinations.filter((item) => item.vaccineName || item.administeredDate).filter((item) => !existingKeys.has(`${item.administeredDate ?? ""}|${String(item.vaccineName ?? "").trim().toLowerCase()}|${item.batchNumber ?? ""}`)).map((item) => ({
      created_by: user.id,
      pedigree_horse_id: horse.pedigree_horse_id,
      vaccine_name: item.vaccineName ?? "Passport vaccination",
      administered_date: item.administeredDate,
      next_due_date: item.nextDueDate,
      batch_number: item.batchNumber,
      notes: item.notes,
    }));
    if (rows.length) await supabase.from("horse_vaccinations").insert(rows);
  }

  for (const file of files) {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(-140) || "passport-page";
    const filePath = `${user.id}/${horseId}/${crypto.randomUUID()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("personal-horse-documents").upload(filePath, file, { contentType: file.type, upsert: false });
    if (uploadError) continue;
    const { error: insertError } = await supabase.from("personal_horse_documents").insert({ personal_horse_id: horseId, owner_id: user.id, document_type: "passport", file_path: filePath, original_filename: file.name, extraction_status: "confirmed", extracted_data: extracted });
    if (insertError) await supabase.storage.from("personal-horse-documents").remove([filePath]);
  }

  revalidatePath("/", "layout");
  return NextResponse.json({ ok: true, importedVaccinations: vaccinations.length });
}