import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/app/lib/supabase/server";
import { createPageMetadata } from "@/app/lib/seo/page-metadata";
import PassportImport from "./PassportImport";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return createPageMetadata("account", "/account/my-horses");
}

export default async function MyHorsesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/account");

  const { data: horses } = await supabase
    .from("personal_horses")
    .select("id,name,birth_date,breed,gender,color,height_cm,ueln,microchip,country_of_birth,passport_number")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true });

  return (
    <main className="min-h-screen bg-[#08111F] px-4 pb-24 pt-28 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[4px] text-blue-400">My Horses · Personal Records</p>
            <h1 className="mt-3 text-3xl font-black sm:text-4xl">My horses</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-400">Add as many horses as you need. Upload a passport photo to fill the form automatically, or enter the information manually.</p>
          </div>
          <Link href="/account" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-200 hover:bg-white/10">← Account</Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.25fr]">
          <PassportImport />

          <section className="rounded-3xl border border-white/10 bg-[#111C2E] p-5 sm:p-7">
            <div className="flex items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[3px] text-gray-500">Your records</p><h2 className="mt-2 text-2xl font-bold">Saved horses</h2></div><span className="rounded-full bg-blue-500/10 px-3 py-1.5 text-xs font-semibold text-blue-300">{horses?.length ?? 0} horses</span></div>
            <div className="mt-5 space-y-3">
              {(horses ?? []).length === 0 ? <p className="rounded-2xl border border-dashed border-white/10 bg-[#0B1422] p-6 text-sm text-gray-500">No personal horse records yet.</p> : (horses ?? []).map((horse) => (
                <Link key={horse.id} href={`/account/my-horses/${horse.id}`} className="block rounded-2xl border border-white/10 bg-[#0B1422] p-4 transition hover:border-blue-500/30 hover:bg-[#0D1828]">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-lg font-bold text-white">{horse.name}</p><p className="mt-1 text-sm text-gray-400">{horse.breed || "Breed not entered"}{horse.gender ? ` · ${horse.gender}` : ""}{horse.color ? ` · ${horse.color}` : ""}</p></div><span className="text-sm font-semibold text-blue-300">Open record →</span></div>
                  <div className="mt-3 grid gap-2 text-xs text-gray-500 sm:grid-cols-3"><span>{horse.birth_date ? new Date(`${horse.birth_date}T00:00:00`).toLocaleDateString("de-DE") : "Birth date —"}</span><span>{horse.height_cm ? `${horse.height_cm} cm` : "Height —"}</span><span>{horse.ueln || "UELN —"}</span></div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
