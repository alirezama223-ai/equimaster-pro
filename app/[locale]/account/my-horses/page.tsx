import { redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { createClient } from "@/app/lib/supabase/server";
import { createPageMetadata } from "@/app/lib/seo/page-metadata";
import { createPersonalHorse } from "@/app/actions/personal-horses";
import PassportOcr from "@/app/components/passport-ocr";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return createPageMetadata("account", "/account/my-horses");
}

function Input({ name, label, type = "text", required = false }: { name: string; label: string; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-gray-400">{label}</span>
      <input name={name} type={type} required={required} className="w-full rounded-xl border border-white/10 bg-[#0B1422] px-3 py-2.5 text-sm text-white outline-none placeholder:text-gray-600 focus:border-blue-500/50" />
    </label>
  );
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
            <p className="mt-2 max-w-2xl text-sm text-gray-400">Add as many horses as you need. Every horse gets its own private record for identity, passport data, vaccinations, medical history, breeding and documents.</p>
          </div>
          <Link href="/account" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-200 hover:bg-white/10">← Account</Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.25fr]">
          <section className="rounded-3xl border border-blue-500/20 bg-gradient-to-br from-[#111C2E] to-[#0B1422] p-5 sm:p-7">
            <div className="mb-5">
              <p className="text-xs font-semibold uppercase tracking-[3px] text-blue-300">＋ New horse</p>
              <h2 className="mt-2 text-2xl font-bold">Add a horse</h2>
              <p className="mt-2 text-sm text-gray-500">Upload the passport first or enter the information manually. You can always correct and complete it later.</p>
            </div>

            <PassportOcr />

            <form action={createPersonalHorse} className="space-y-4">
              <Input name="name" label="Horse name" required />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input name="birth_date" label="Date of birth" type="date" />
                <label className="block"><span className="mb-1.5 block text-xs font-semibold text-gray-400">Gender</span><select name="gender" defaultValue="" className="w-full rounded-xl border border-white/10 bg-[#0B1422] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50"><option value="">Not entered</option><option value="Mare">Mare</option><option value="Stallion">Stallion</option><option value="Gelding">Gelding</option></select></label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2"><Input name="breed" label="Breed" /><Input name="color" label="Colour" /></div>
              <div className="grid gap-4 sm:grid-cols-2"><Input name="height_cm" label="Height (cm)" type="number" /><Input name="country_of_birth" label="Country of birth" /></div>
              <div className="grid gap-4 sm:grid-cols-2"><Input name="studbook" label="Studbook" /><Input name="passport_number" label="Passport number" /></div>
              <div className="grid gap-4 sm:grid-cols-2"><Input name="ueln" label="UELN / life number" /><Input name="microchip" label="Transponder / microchip" /></div>
              <label className="block"><span className="mb-1.5 block text-xs font-semibold text-gray-400">Private notes</span><textarea name="notes" className="min-h-24 w-full rounded-xl border border-white/10 bg-[#0B1422] p-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-blue-500/50" placeholder="Anything you want to remember about this horse..." /></label>
              <button className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500">Create horse record</button>
            </form>
          </section>

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
