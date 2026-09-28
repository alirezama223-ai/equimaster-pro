import { redirect, notFound } from "next/navigation";
import { createClient } from "@/app/lib/supabase/server";
import { createPageMetadata } from "@/app/lib/seo/page-metadata";
import MyHorseProfile from "@/app/components/account/MyHorseProfile";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

export async function generateMetadata() { return createPageMetadata("account", "/account/my-horses"); }

const sireLine = [
  { name: "Emerald van het Ruytershof", breed: "Belgisches Warmblut (BWP)", registration_number: "056002W00233177", sex: "stallion", sire: "Diamant de Semilly", dam: "Carthina Z" },
  { name: "Diamant de Semilly", breed: "Selle Français", registration_number: "FRA 00191446545F", sex: "stallion", sire: "Le Tot de Semilly", dam: "Venise des Cresles" },
  { name: "Carthina Z", breed: "Zangersheide Reitpferd", registration_number: "BEL 015Z55536700", sex: "mare", sire: "Carthago Z", dam: "Tangra S van het Darohof" },
  { name: "Le Tot de Semilly", breed: "Selle Français", registration_number: "FRA 001177037073A", sex: "stallion", sire: "Grand Veneur", dam: "Venue du Tot" },
  { name: "Venise des Cresles", breed: "Selle Français", registration_number: "FRA 00187354224F", sex: "mare", sire: "FRA 001177037073A", dam: "Miss des Cresles" },
  { name: "Carthago Z", breed: "Holsteiner", registration_number: "DEU 321210021987", sex: "stallion", sire: "Capitol I", dam: "Perra" },
  { name: "Tangra S van het Darohof", breed: "Belgisches Warmblut (BWP)", registration_number: "BEL 002W00158416", sex: "mare", sire: "Lys de Darmen", dam: "Gesina van het Darohof" },
];

const vaccinations = [
  { date: "2023-12-28", product: "Equilis Te", disease: "Tetanus", batch: "A0U4P0U", note: "Passport entry · VHO · Germany" },
  { date: "2024-01-24", product: "Equilis Te", disease: "Tetanus", batch: "A0U4P0U", note: "Passport entry · VHO · Germany" },
  { date: "2025-01-22", product: "Equilis Te", disease: "Tetanus", batch: "A048A03", note: "Passport entry · VHO · Germany" },
  { date: "2026-05-02", product: "ProteqFlu", disease: "Equine influenza", note: "Passport entry · VHB · Germany" },
  { date: "2026-06-10", product: "Equilis Prequenza", disease: "Equine influenza", note: "Passport entry · VHB · Germany" },
];

async function getOrCreate(supabase: any, userId: string, data: (typeof sireLine)[number]) {
  const normalized = data.name.trim().toLowerCase();
  const { data: existing } = await supabase.from("pedigree_horses").select("id,name,breed,registration_number,sex,sire_id,dam_id").eq("normalized_name", normalized).maybeSingle();
  if (existing) return existing;
  const { data: created } = await supabase.from("pedigree_horses").insert({ name: data.name, normalized_name: normalized, breed: data.breed, registration_number: data.registration_number, sex: data.sex, created_by: userId }).select("id,name,breed,registration_number,sex,sire_id,dam_id").single();
  return created;
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
    if (sire || dam) await supabase.from("pedigree_horses").update({ sire_id: sire?.id ?? null, dam_id: dam?.id ?? null }).eq("id", row.id);
  }

  let { data: myPedigree } = await supabase.from("pedigree_horses").select("*").eq("normalized_name", "my horse").eq("created_by", user.id).maybeSingle();
  if (!myPedigree) {
    const { data: created } = await supabase.from("pedigree_horses").insert({ name: "My Horse", normalized_name: "my horse", birth_year: 2023, breed: "Deutsches Sportpferd", sex: "mare", color: "Fuchs", country: "Deutschland", created_by: user.id, sire_id: pedigreeRecords["Emerald van het Ruytershof"]?.id ?? null }).select("*").single();
    myPedigree = created;
  }

  let { data: personalHorse } = await supabase.from("personal_horses").select("*").eq("owner_id", user.id).eq("name", "My Horse").maybeSingle();
  if (!personalHorse) {
    const { data: created } = await supabase.from("personal_horses").insert({ owner_id: user.id, pedigree_horse_id: myPedigree?.id ?? null, name: "My Horse", birth_date: "2023-03-27", breed: "Deutsches Sportpferd", gender: "Mare", color: "Fuchs", country_of_birth: "Deutschland", studbook: "Deutsches Sportpferd", ueln: "276481810084923", microchip: "276020000825800" }).select("*").single();
    personalHorse = created;
  } else if (myPedigree && personalHorse.pedigree_horse_id !== myPedigree.id) {
    await supabase.from("personal_horses").update({ pedigree_horse_id: myPedigree.id }).eq("id", personalHorse.id);
    personalHorse.pedigree_horse_id = myPedigree.id;
  }

  if (!personalHorse) notFound();
  return <MyHorseProfile horse={personalHorse} sireLine={sireLine} vaccinations={vaccinations} />;
}
