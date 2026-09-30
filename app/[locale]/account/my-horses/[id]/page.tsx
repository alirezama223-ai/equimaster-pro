import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/app/lib/supabase/server";
import { createPageMetadata } from "@/app/lib/seo/page-metadata";
import { updatePersonalHorse } from "@/app/actions/personal-horses";
import MyHorseProfile from "@/app/components/account/MyHorseProfile";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

type PedigreeRow = { id: string; name: string; breed: string | null; registration_number: string | null; sex: string; sire_id: string | null; dam_id: string | null };

export async function generateMetadata() { return createPageMetadata("account", "/account/my-horses"); }

async function getOwnedHorse(supabase: any, userId: string, horseId: string) {
  const { data } = await supabase.from("personal_horses").select("*").eq("id", horseId).eq("owner_id", userId).maybeSingle();
  return data;
}

export async function deletePersonalHorse(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/account");
  const horseId = String(formData.get("horse_id") || "");
  const confirmation = String(formData.get("confirmation") || "").trim();
  const horse = await getOwnedHorse(supabase, user.id, horseId);
  if (!horse || confirmation !== "DELETE") return;

  const { data: documents } = await supabase.from("personal_horse_documents").select("file_path").eq("personal_horse_id", horseId).eq("owner_id", user.id);
  const paths = (documents ?? []).map((item: any) => item.file_path).filter(Boolean);
  if (paths.length) await supabase.storage.from("personal-horse-documents").remove(paths);
  await supabase.from("personal_horse_documents").delete().eq("personal_horse_id", horseId).eq("owner_id", user.id);

  if (horse.pedigree_horse_id) {
    await supabase.from("horse_vaccinations").delete().eq("pedigree_horse_id", horse.pedigree_horse_id).eq("created_by", user.id);
    await supabase.from("horse_vet_visits").delete().eq("pedigree_horse_id", horse.pedigree_horse_id).eq("created_by", user.id);
    await supabase.from("horse_breeding_events").delete().eq("pedigree_horse_id", horse.pedigree_horse_id).eq("created_by", user.id);
  }

  await supabase.from("personal_horses").delete().eq("id", horseId).eq("owner_id", user.id);
  if (horse.pedigree_horse_id) {
    const { count } = await supabase.from("personal_horses").select("id", { count: "exact", head: true }).eq("pedigree_horse_id", horse.pedigree_horse_id);
    if ((count ?? 0) === 0) await supabase.from("pedigree_horses").delete().eq("id", horse.pedigree_horse_id).eq("created_by", user.id);
  }
  revalidatePath("/account/my-horses");
  redirect("/account/my-horses");
}

export async function addHorseVaccination(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/account");
  const horse = await getOwnedHorse(supabase, user.id, String(formData.get("horse_id") || "")); if (!horse?.pedigree_horse_id) return;
  await supabase.from("horse_vaccinations").insert({ created_by: user.id, pedigree_horse_id: horse.pedigree_horse_id, vaccine_name: String(formData.get("vaccine_name") || "").trim(), administered_date: String(formData.get("administered_date") || ""), next_due_date: String(formData.get("next_due_date") || "") || null, batch_number: String(formData.get("batch_number") || "").trim() || null, notes: String(formData.get("notes") || "").trim() || null });
  revalidatePath(`/account/my-horses/${horse.id}`);
}

export async function addHorseVetVisit(formData: FormData) {
  "use server";
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/account");
  const horse = await getOwnedHorse(supabase, user.id, String(formData.get("horse_id") || "")); if (!horse?.pedigree_horse_id) return;
  await supabase.from("horse_vet_visits").insert({ created_by: user.id, pedigree_horse_id: horse.pedigree_horse_id, visit_date: String(formData.get("visit_date") || ""), reason: String(formData.get("reason") || "").trim(), diagnosis: String(formData.get("diagnosis") || "").trim() || null, treatment: String(formData.get("treatment") || "").trim() || null, follow_up_date: String(formData.get("follow_up_date") || "") || null, notes: String(formData.get("notes") || "").trim() || null });
  revalidatePath(`/account/my-horses/${horse.id}`);
}

export async function addHorseBreedingEvent(formData: FormData) {
  "use server";
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/account");
  const horse = await getOwnedHorse(supabase, user.id, String(formData.get("horse_id") || "")); if (!horse?.pedigree_horse_id) return;
  await supabase.from("horse_breeding_events").insert({ created_by: user.id, pedigree_horse_id: horse.pedigree_horse_id, event_date: String(formData.get("event_date") || ""), event_type: String(formData.get("event_type") || "insemination"), stallion_name: String(formData.get("stallion_name") || "").trim() || null, method: String(formData.get("method") || "").trim() || null, pregnancy_status: String(formData.get("pregnancy_status") || "").trim() || null, ultrasound_date: String(formData.get("ultrasound_date") || "") || null, expected_foaling_date: String(formData.get("expected_foaling_date") || "") || null, foaling_date: String(formData.get("foaling_date") || "") || null, notes: String(formData.get("notes") || "").trim() || null });
  revalidatePath(`/account/my-horses/${horse.id}`);
}

export async function updateHorseNotes(formData: FormData) {
  "use server";
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/account");
  const horseId = String(formData.get("horse_id") || ""); await supabase.from("personal_horses").update({ notes: String(formData.get("notes") || "") }).eq("id", horseId).eq("owner_id", user.id); revalidatePath(`/account/my-horses/${horseId}`);
}

export async function uploadHorseDocument(formData: FormData) {
  "use server";
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/account");
  const horseId = String(formData.get("horse_id") || ""); const horse = await getOwnedHorse(supabase, user.id, horseId); if (!horse) return;
  const fileValue = formData.get("document"); if (!(fileValue instanceof File) || fileValue.size === 0) return;
  const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]); if (!allowedTypes.has(fileValue.type) || fileValue.size > 25 * 1024 * 1024) return;
  const documentType = String(formData.get("document_type") || "other").trim(); const safeName = fileValue.name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(-140) || "document"; const filePath = `${user.id}/${horseId}/${crypto.randomUUID()}-${safeName}`;
  const { error: uploadError } = await supabase.storage.from("personal-horse-documents").upload(filePath, fileValue, { contentType: fileValue.type, upsert: false }); if (uploadError) return;
  const { error: insertError } = await supabase.from("personal_horse_documents").insert({ personal_horse_id: horseId, owner_id: user.id, document_type: documentType, file_path: filePath, original_filename: fileValue.name, extraction_status: "pending" }); if (insertError) await supabase.storage.from("personal-horse-documents").remove([filePath]);
  revalidatePath(`/account/my-horses/${horseId}`);
}

export async function deleteHorseDocument(formData: FormData) {
  "use server";
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/account");
  const documentId = String(formData.get("document_id") || ""); const { data: document } = await supabase.from("personal_horse_documents").select("id,file_path,personal_horse_id").eq("id", documentId).eq("owner_id", user.id).maybeSingle(); if (!document) return;
  await supabase.storage.from("personal-horse-documents").remove([document.file_path]); await supabase.from("personal_horse_documents").delete().eq("id", document.id).eq("owner_id", user.id); revalidatePath(`/account/my-horses/${document.personal_horse_id}`);
}

async function loadPedigree(supabase: any, rootId: string) {
  const records = new Map<string, PedigreeRow>(); let ids = [rootId];
  for (let depth = 0; depth < 4 && ids.length; depth += 1) { const uniqueIds = [...new Set(ids)]; const { data } = await supabase.from("pedigree_horses").select("id,name,breed,registration_number,sex,sire_id,dam_id").in("id", uniqueIds); for (const row of (data ?? []) as PedigreeRow[]) records.set(row.id, row); ids = (data ?? []).flatMap((row: PedigreeRow) => [row.sire_id, row.dam_id].filter(Boolean) as string[]).filter((id: string) => !records.has(id)); }
  const byId = records; return [...records.values()].map((row) => ({ name: row.name, breed: row.breed ?? "", registration_number: row.registration_number ?? "", sex: row.sex, sire: row.sire_id ? byId.get(row.sire_id)?.name ?? null : null, dam: row.dam_id ? byId.get(row.dam_id)?.name ?? null : null }));
}

export default async function MyHorsePage({ params }: Props) {
  const { id } = await params; const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/account");
  let horseId = id;
  if (id === "my-horse") { const { data: legacyHorse } = await supabase.from("personal_horses").select("id").eq("owner_id", user.id).eq("name", "Emma").maybeSingle(); if (!legacyHorse) redirect("/account/my-horses"); horseId = legacyHorse.id; }
  const personalHorse = await getOwnedHorse(supabase, user.id, horseId); if (!personalHorse) notFound();
  const pedigreeId = personalHorse.pedigree_horse_id;
  const [sireLine, vaccinationResult, vetResult, breedingResult, documentResult] = await Promise.all([
    pedigreeId ? loadPedigree(supabase, pedigreeId) : Promise.resolve([]),
    pedigreeId ? supabase.from("horse_vaccinations").select("id,administered_date,vaccine_name,batch_number,notes,next_due_date").eq("created_by", user.id).eq("pedigree_horse_id", pedigreeId).order("administered_date", { ascending: false }) : Promise.resolve({ data: [] }),
    pedigreeId ? supabase.from("horse_vet_visits").select("id,visit_date,reason,diagnosis,treatment,follow_up_date,notes").eq("created_by", user.id).eq("pedigree_horse_id", pedigreeId).order("visit_date", { ascending: false }) : Promise.resolve({ data: [] }),
    pedigreeId ? supabase.from("horse_breeding_events").select("id,event_date,event_type,stallion_name,method,pregnancy_status,ultrasound_date,expected_foaling_date,foaling_date,notes").eq("created_by", user.id).eq("pedigree_horse_id", pedigreeId).order("event_date", { ascending: false }) : Promise.resolve({ data: [] }),
    supabase.from("personal_horse_documents").select("id,document_type,file_path,original_filename,extraction_status,extracted_data,created_at").eq("owner_id", user.id).eq("personal_horse_id", personalHorse.id).order("created_at", { ascending: false }),
  ]);
  const documents = await Promise.all((documentResult.data ?? []).map(async (document: any) => { const { data: signed } = await supabase.storage.from("personal-horse-documents").createSignedUrl(document.file_path, 60 * 60); return { id: document.id, type: document.document_type, filename: document.original_filename ?? "Document", status: document.extraction_status, createdAt: document.created_at, url: signed?.signedUrl ?? null, extractedData: document.extracted_data ?? {} }; }));
  return <MyHorseProfile horse={personalHorse} sireLine={sireLine} vaccinations={(vaccinationResult.data ?? []).map((item: any) => ({ date: item.administered_date, product: item.vaccine_name, disease: item.notes?.split(" · ")[0] ?? "", batch: item.batch_number ?? undefined, note: item.notes?.split(" · ").slice(1).join(" · ") || undefined, nextDue: item.next_due_date ?? undefined }))} vetVisits={vetResult.data ?? []} breedingEvents={breedingResult.data ?? []} documents={documents} addVaccination={addHorseVaccination} addVetVisit={addHorseVetVisit} addBreedingEvent={addHorseBreedingEvent} uploadDocument={uploadHorseDocument} deleteDocument={deleteHorseDocument} updateNotes={updateHorseNotes} updateHorse={updatePersonalHorse} deleteHorse={deletePersonalHorse} />;
}
