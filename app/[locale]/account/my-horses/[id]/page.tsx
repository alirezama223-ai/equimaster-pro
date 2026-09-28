import { redirect, notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/app/lib/supabase/server";
import { createPageMetadata } from "@/app/lib/seo/page-metadata";
import MyHorseProfile from "@/app/components/account/MyHorseProfile";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata() {
  return createPageMetadata("account", "/account/my-horses");
}

const sireLine = [
  { name: "Emerald van het Ruytershof", breed: "Belgisches Warmblut (BWP)", registration_number: "056002W00233177", sex: "stallion", sire: "Diamant de Semilly", dam: "Carthina Z" },
  { name: "Diamant de Semilly", breed: "Selle Français", registration_number: "FRA 00191446545F", sex: "stallion", sire: "Le Tot de Semilly", dam: "Venise des Cresles" },
  { name: "Carthina Z", breed: "Zangersheide Reitpferd", registration_number: "BEL 015Z55536700", sex: "mare", sire: "Carthago Z", dam: "Tangra S van het Darohof" },
  { name: "Le Tot de Semilly", breed: "Selle Français", registration_number: "FRA 001177037073A", sex: "stallion", sire: "Grand Veneur", dam: "Venue du Tot" },
  { name: "Venise des Cresles", breed: "Selle Français", registration_number: "FRA 00187354224F", sex: "mare", sire: "FRA 001177037073A", dam: "Miss des Cresles" },
  { name: "Carthago Z", breed: "Holsteiner", registration_number: "DEU 321210021987", sex: "stallion", sire: "Capitol I", dam: "Perra" },
  { name: "Tangra S van het Darohof", breed: "Belgisches Warmblut (BWP)", registration_number: "BEL 002W00158416", sex: "mare", sire: "Lys de Darmen", dam: "Gesina van het Darohof" },
];

const passportVaccinations = [
  { date: "2023-12-28", product: "Equilis Te", disease: "Tetanus", batch: "A0U4P0U", note: "Passport entry · VHO · Germany" },
  { date: "2024-01-24", product: "Equilis Te", disease: "Tetanus", batch: "A0U4P0U", note: "Passport entry · VHO · Germany" },
  { date: "2025-01-22", product: "Equilis Te", disease: "Tetanus", batch: "A048A03", note: "Passport entry · VHO · Germany" },
  { date: "2026-05-02", product: "ProteqFlu", disease: "Equine influenza", note: "Passport entry · VHB · Germany" },
  { date: "2026-06-10", product: "Equilis Prequenza", disease: "Equine influenza", note: "Passport entry · VHB · Germany" },
];

async function getOrCreate(supabase: any, userId: string, data: (typeof sireLine)[number]) {
  const normalized = data.name.trim().toLowerCase();
  const { data: existing } = await supabase
    .from("pedigree_horses")
    .select("id,name,breed,registration_number,sex,sire_id,dam_id")
    .eq("normalized_name", normalized)
    .maybeSingle();
  if (existing) return existing;

  const { data: created } = await supabase
    .from("pedigree_horses")
    .insert({
      name: data.name,
      normalized_name: normalized,
      breed: data.breed,
      registration_number: data.registration_number,
      sex: data.sex,
      created_by: userId,
    })
    .select("id,name,breed,registration_number,sex,sire_id,dam_id")
    .single();
  return created;
}

async function getOwnedHorse(supabase: any, userId: string, horseId: string) {
  const { data } = await supabase
    .from("personal_horses")
    .select("id,pedigree_horse_id,name")
    .eq("id", horseId)
    .eq("owner_id", userId)
    .maybeSingle();
  return data;
}

export async function addHorseVaccination(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/account");
  const horse = await getOwnedHorse(supabase, user.id, String(formData.get("horse_id") || ""));
  if (!horse?.pedigree_horse_id) return;

  await supabase.from("horse_vaccinations").insert({
    created_by: user.id,
    pedigree_horse_id: horse.pedigree_horse_id,
    vaccine_name: String(formData.get("vaccine_name") || "").trim(),
    administered_date: String(formData.get("administered_date") || ""),
    next_due_date: String(formData.get("next_due_date") || "") || null,
    batch_number: String(formData.get("batch_number") || "").trim() || null,
    notes: String(formData.get("notes") || "").trim() || null,
  });
  revalidatePath("/", "layout");
}

export async function addHorseVetVisit(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/account");
  const horse = await getOwnedHorse(supabase, user.id, String(formData.get("horse_id") || ""));
  if (!horse?.pedigree_horse_id) return;

  await supabase.from("horse_vet_visits").insert({
    created_by: user.id,
    pedigree_horse_id: horse.pedigree_horse_id,
    visit_date: String(formData.get("visit_date") || ""),
    reason: String(formData.get("reason") || "").trim() || null,
    diagnosis: String(formData.get("diagnosis") || "").trim() || null,
    treatment: String(formData.get("treatment") || "").trim() || null,
    follow_up_date: String(formData.get("follow_up_date") || "") || null,
    notes: String(formData.get("notes") || "").trim() || null,
  });
  revalidatePath("/", "layout");
}

export async function addHorseBreedingEvent(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/account");
  const horse = await getOwnedHorse(supabase, user.id, String(formData.get("horse_id") || ""));
  if (!horse?.pedigree_horse_id) return;

  await supabase.from("horse_breeding_events").insert({
    created_by: user.id,
    pedigree_horse_id: horse.pedigree_horse_id,
    event_date: String(formData.get("event_date") || ""),
    event_type: String(formData.get("event_type") || "insemination"),
    stallion_name: String(formData.get("stallion_name") || "").trim() || null,
    method: String(formData.get("method") || "").trim() || null,
    pregnancy_status: String(formData.get("pregnancy_status") || "").trim() || null,
    ultrasound_date: String(formData.get("ultrasound_date") || "") || null,
    expected_foaling_date: String(formData.get("expected_foaling_date") || "") || null,
    foaling_date: String(formData.get("foaling_date") || "") || null,
    notes: String(formData.get("notes") || "").trim() || null,
  });
  revalidatePath("/", "layout");
}

export async function updateHorseNotes(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/account");
  await supabase
    .from("personal_horses")
    .update({ notes: String(formData.get("notes") || "") })
    .eq("id", String(formData.get("horse_id") || ""))
    .eq("owner_id", user.id);
  revalidatePath("/", "layout");
}

export async function uploadHorseDocument(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/account");

  const horseId = String(formData.get("horse_id") || "");
  const horse = await getOwnedHorse(supabase, user.id, horseId);
  if (!horse) return;

  const fileValue = formData.get("document");
  if (!(fileValue instanceof File) || fileValue.size === 0) return;

  const allowedTypes = new Set(["application/pdf", "image/jpeg", "image/png", "image/webp"]);
  if (!allowedTypes.has(fileValue.type) || fileValue.size > 25 * 1024 * 1024) return;

  const documentType = String(formData.get("document_type") || "other").trim();
  const safeName = fileValue.name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(-140) || "document";
  const filePath = `${user.id}/${horseId}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("personal-horse-documents")
    .upload(filePath, fileValue, { contentType: fileValue.type, upsert: false });
  if (uploadError) return;

  const { error: insertError } = await supabase.from("personal_horse_documents").insert({
    personal_horse_id: horseId,
    owner_id: user.id,
    document_type: documentType,
    file_path: filePath,
    original_filename: fileValue.name,
    extraction_status: "pending",
  });

  if (insertError) {
    await supabase.storage.from("personal-horse-documents").remove([filePath]);
    return;
  }

  revalidatePath("/", "layout");
}

export async function deleteHorseDocument(formData: FormData) {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/account");

  const documentId = String(formData.get("document_id") || "");
  const { data: document } = await supabase
    .from("personal_horse_documents")
    .select("id,file_path")
    .eq("id", documentId)
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!document) return;

  await supabase.storage.from("personal-horse-documents").remove([document.file_path]);
  await supabase.from("personal_horse_documents").delete().eq("id", document.id).eq("owner_id", user.id);
  revalidatePath("/", "layout");
}

export default async function MyHorsePage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/account");
  if (id !== "my-horse") notFound();

  const pedigreeRecords: Record<string, any> = {};
  for (const entry of sireLine) pedigreeRecords[entry.name] = await getOrCreate(supabase, user.id, entry);
  for (const entry of sireLine) {
    const row = pedigreeRecords[entry.name];
    if (!row) continue;
    const sire = pedigreeRecords[entry.sire];
    const dam = pedigreeRecords[entry.dam];
    if (sire || dam) {
      await supabase.from("pedigree_horses").update({ sire_id: sire?.id ?? null, dam_id: dam?.id ?? null }).eq("id", row.id);
    }
  }

  let { data: myPedigree } = await supabase
    .from("pedigree_horses")
    .select("*")
    .eq("normalized_name", "my horse")
    .eq("created_by", user.id)
    .maybeSingle();
  if (!myPedigree) {
    const { data: created } = await supabase.from("pedigree_horses").insert({
      name: "My Horse",
      normalized_name: "my horse",
      birth_year: 2023,
      breed: "Deutsches Sportpferd",
      sex: "mare",
      color: "Fuchs",
      country: "Deutschland",
      created_by: user.id,
      sire_id: pedigreeRecords["Emerald van het Ruytershof"]?.id ?? null,
    }).select("*").single();
    myPedigree = created;
  }

  let { data: personalHorse } = await supabase
    .from("personal_horses")
    .select("*")
    .eq("owner_id", user.id)
    .eq("name", "My Horse")
    .maybeSingle();
  if (!personalHorse) {
    const { data: created } = await supabase.from("personal_horses").insert({
      owner_id: user.id,
      pedigree_horse_id: myPedigree?.id ?? null,
      name: "My Horse",
      birth_date: "2023-03-27",
      breed: "Deutsches Sportpferd",
      gender: "Mare",
      color: "Fuchs",
      country_of_birth: "Deutschland",
      studbook: "Deutsches Sportpferd",
      ueln: "276481810084923",
      microchip: "276020000825800",
    }).select("*").single();
    personalHorse = created;
  } else if (myPedigree && personalHorse.pedigree_horse_id !== myPedigree.id) {
    await supabase.from("personal_horses").update({ pedigree_horse_id: myPedigree.id }).eq("id", personalHorse.id);
    personalHorse.pedigree_horse_id = myPedigree.id;
  }

  if (!personalHorse || !myPedigree) notFound();

  const { data: existingVaccinations } = await supabase
    .from("horse_vaccinations")
    .select("id,administered_date,vaccine_name,batch_number,notes,next_due_date")
    .eq("created_by", user.id)
    .eq("pedigree_horse_id", myPedigree.id)
    .order("administered_date", { ascending: false });
  const existingKeys = new Set((existingVaccinations ?? []).map((item: any) => `${item.administered_date}|${item.vaccine_name}`));
  const missing = passportVaccinations.filter((item) => !existingKeys.has(`${item.date}|${item.product}`));
  if (missing.length) {
    await supabase.from("horse_vaccinations").insert(missing.map((item) => ({
      created_by: user.id,
      pedigree_horse_id: myPedigree!.id,
      vaccine_name: item.product,
      administered_date: item.date,
      batch_number: item.batch ?? null,
      notes: `${item.disease} · ${item.note}`,
    })));
  }

  const { data: vaccinations } = await supabase
    .from("horse_vaccinations")
    .select("id,administered_date,vaccine_name,batch_number,notes,next_due_date")
    .eq("created_by", user.id)
    .eq("pedigree_horse_id", myPedigree.id)
    .order("administered_date", { ascending: false });
  const { data: vetVisits } = await supabase
    .from("horse_vet_visits")
    .select("id,visit_date,reason,diagnosis,treatment,follow_up_date,notes")
    .eq("created_by", user.id)
    .eq("pedigree_horse_id", myPedigree.id)
    .order("visit_date", { ascending: false });
  const { data: breedingEvents } = await supabase
    .from("horse_breeding_events")
    .select("id,event_date,event_type,stallion_name,method,pregnancy_status,ultrasound_date,expected_foaling_date,foaling_date,notes")
    .eq("created_by", user.id)
    .eq("pedigree_horse_id", myPedigree.id)
    .order("event_date", { ascending: false });

  const { data: rawDocuments } = await supabase
    .from("personal_horse_documents")
    .select("id,document_type,file_path,original_filename,extraction_status,extracted_data,created_at")
    .eq("owner_id", user.id)
    .eq("personal_horse_id", personalHorse.id)
    .order("created_at", { ascending: false });

  const documents = await Promise.all((rawDocuments ?? []).map(async (document: any) => {
    const { data: signed } = await supabase.storage
      .from("personal-horse-documents")
      .createSignedUrl(document.file_path, 60 * 60);
    return {
      id: document.id,
      type: document.document_type,
      filename: document.original_filename ?? "Document",
      status: document.extraction_status,
      createdAt: document.created_at,
      url: signed?.signedUrl ?? null,
      extractedData: document.extracted_data ?? {},
    };
  }));

  return <MyHorseProfile
    horse={personalHorse}
    sireLine={sireLine}
    vaccinations={(vaccinations ?? []).map((item: any) => ({
      date: item.administered_date,
      product: item.vaccine_name,
      disease: item.notes?.split(" · ")[0] ?? "",
      batch: item.batch_number ?? undefined,
      note: item.notes?.split(" · ").slice(1).join(" · ") || undefined,
      nextDue: item.next_due_date ?? undefined,
    }))}
    vetVisits={vetVisits ?? []}
    breedingEvents={breedingEvents ?? []}
    documents={documents}
    addVaccination={addHorseVaccination}
    addVetVisit={addHorseVetVisit}
    addBreedingEvent={addHorseBreedingEvent}
    uploadDocument={uploadHorseDocument}
    deleteDocument={deleteHorseDocument}
    updateNotes={updateHorseNotes}
  />;
}
