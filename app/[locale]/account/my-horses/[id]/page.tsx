import { redirect, notFound } from "next/navigation";
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
  { name: "Venise des Cresles", breed: "Selle Français", registration_number: "FRA 00187354224F", sex: "mare", sire: "Elf III", dam: "Miss des Cresles" },
  { name: "Carthago Z", breed: "Holsteiner", registration_number: "DEU 321210021987", sex: "stallion", sire: "Capitol I", dam: "Perra" },
  { name: "Tangra S van het Darohof", breed: "Belgisches Warmblut (BWP)", registration_number: "BEL 002W00158416", sex: "mare", sire: "Lys de Darmen", dam: "Gesina van het Darohof" },
];

async function getOrCreatePedigreeHorse(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, data: (typeof sireLine)[number]) {
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
  for (const entry of sireLine) {
    const row = await getOrCreatePedigreeHorse(supabase, user.id, entry);
    if (row) pedigreeRecords[entry.name] = row;
  }
  for (const entry of sireLine) {
    const row = pedigreeRecords[entry.name];
    if (!row) continue;
    const sire = entry.sire ? pedigreeRecords[entry.sire] : null;
    const dam = entry.dam ? pedigreeRecords[entry.dam] : null;
    if (sire || dam) await supabase.from("pedigree_horses").update({ sire_id: sire?.id ?? null, dam_id: dam?.id ?? null }).eq("id", row.id);
  }

  const { data: horse } = await supabase.from("personal_horses").select("*").eq("owner_id", user.id).eq("name", "My Horse").maybeSingle();
  let personalHorse = horse;
  if (!personalHorse) {
    const { data: created } = await supabase.from("personal_horses").insert({ owner_id: user.id, pedigree_horse_id: null, name: "My Horse", birth_date: "2023-03-27", breed: "Deutsches Sportpferd", gender: "Mare", color: "Fuchs", ueln: "276481810084923", microchip: "276020000825800", country_of_birth: "Deutschland", studbook: "Deutsches Sportpferd" }).select("*").single();
    personalHorse = created;
  }

  if (!personalHorse) notFound();
  return <MyHorseProfile horse={personalHorse} sireLine={sireLine} />;
}
