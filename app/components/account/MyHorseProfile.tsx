"use client";

import { Link } from "@/i18n/navigation";

type Horse = {
  name: string; birth_date: string | null; breed: string | null; gender: string | null; color: string | null;
  height_cm: number | null; ueln: string | null; microchip: string | null; country_of_birth: string | null;
  studbook: string | null; passport_number: string | null;
};
type PedigreeEntry = { name: string; breed: string; registration_number: string; sex: string; sire?: string; dam?: string };

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return <section id={id} className="rounded-3xl border border-white/10 bg-[#111C2E] p-5 sm:p-7 scroll-mt-28"><h2 className="text-xl font-bold text-white">{title}</h2><div className="mt-5">{children}</div></section>;
}

export default function MyHorseProfile({ horse, sireLine }: { horse: Horse; sireLine: PedigreeEntry[] }) {
  return (
    <main className="min-h-screen bg-[#08111F] px-4 pb-24 pt-28 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[4px] text-blue-400">My Horses · Personal Record</p><h1 className="mt-3 text-3xl font-black sm:text-4xl">{horse.name}</h1><p className="mt-2 text-gray-400">Private horse profile — not a sale listing</p></div>
          <Link href="/account" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-200 hover:bg-white/10">← Account</Link>
        </div>
        <nav className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-[#0B1422] p-2">{["Overview","Pedigree","Vaccinations","Medical","Breeding","Documents","Training","Notes"].map((item)=><a key={item} href={`#${item.toLowerCase()}`} className="whitespace-nowrap rounded-xl px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white">{item}</a>)}</nav>
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Section id="overview" title="Overview"><div className="grid gap-3 sm:grid-cols-2">{[
            ["Date of birth", horse.birth_date ? new Date(`${horse.birth_date}T00:00:00`).toLocaleDateString("de-DE") : "—"],
            ["Breed", horse.breed ?? "—"],["Gender", horse.gender ?? "—"],["Colour", horse.color ?? "—"],["Height", horse.height_cm ? `${horse.height_cm} cm` : "—"],
            ["UELN / Life number", horse.ueln ?? "—"],["Transponder", horse.microchip ?? "—"],["Studbook", horse.studbook ?? "—"],["Country of birth", horse.country_of_birth ?? "—"],["Passport", horse.passport_number ?? "Not entered yet"]
          ].map(([label,value])=><div key={label} className="rounded-2xl border border-white/10 bg-[#0B1422] p-4"><p className="text-xs text-gray-500">{label}</p><p className="mt-1 break-words font-semibold text-white">{value}</p></div>)}</div></Section>

          <Section id="pedigree" title="Pedigree"><div className="space-y-3">{sireLine.map((item)=><div key={item.name} className="rounded-2xl border border-white/10 bg-[#0B1422] p-4"><p className="text-[11px] uppercase tracking-wider text-blue-400">{item.name === "Emerald van het Ruytershof" ? "Sire" : "Sire-line ancestor"}</p><p className="mt-1 font-semibold text-white">{item.name}</p><p className="mt-1 text-sm text-gray-400">{item.breed}</p><p className="mt-1 text-xs text-gray-500">{item.registration_number}</p></div>)}</div><p className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200">The dam side is intentionally not guessed. Add the mother&apos;s passport page and we can connect the maternal line accurately.</p></Section>

          <Section id="vaccinations" title="Vaccinations"><div className="rounded-2xl border border-dashed border-white/10 bg-[#0B1422] p-5 text-sm text-gray-400">No vaccination entries have been saved yet. The next step is to scan the vaccination pages and save each date, product, batch and next-due date into the horse record.</div></Section>
          <Section id="medical" title="Medical"><div className="rounded-2xl border border-dashed border-white/10 bg-[#0B1422] p-5 text-sm text-gray-400">Medical examinations, treatments, injuries, medication and X-rays will be linked to this horse&apos;s private record.</div></Section>
          <Section id="breeding" title="Breeding"><div className="rounded-2xl border border-dashed border-white/10 bg-[#0B1422] p-5 text-sm text-gray-400">Breeding events, insemination, stallion, ultrasound checks, pregnancy status and foaling dates will be stored here.</div></Section>
          <Section id="documents" title="Documents"><div className="grid gap-3 sm:grid-cols-2">{["Equidenpass","Zuchtbescheinigung","Vaccination pages","Pedigree pages"].map(doc=><div key={doc} className="rounded-2xl border border-white/10 bg-[#0B1422] p-4"><p className="font-semibold">{doc}</p><p className="mt-1 text-xs text-gray-500">Ready for private document upload</p></div>)}</div></Section>
          <Section id="training" title="Training"><div className="rounded-2xl border border-dashed border-white/10 bg-[#0B1422] p-5 text-sm text-gray-400">Training sessions, competitions, results and milestones will be linked to this horse.</div></Section>
          <Section id="notes" title="Notes"><div className="rounded-2xl border border-dashed border-white/10 bg-[#0B1422] p-5 text-sm text-gray-400">Private notes about the horse, routines, equipment and care.</div></Section>
        </div>
      </div>
    </main>
  );
}
