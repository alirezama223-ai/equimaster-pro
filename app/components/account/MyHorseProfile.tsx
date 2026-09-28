"use client";

const pedigree = [
  { label: "Father", name: "Diamant de Semilly", breed: "Selle Français", id: "FRA 00191446545F" },
  { label: "Mother", name: "Carthina Z", breed: "Zangersheide Reitpferd", id: "BEL 015Z55536700" },
  { label: "Paternal grandsire", name: "Le Tot de Semilly", breed: "Selle Français", id: "FRA 001177037073A" },
  { label: "Paternal granddam", name: "Venise des Cresles", breed: "Selle Français", id: "FRA 00187354224F" },
  { label: "Maternal grandsire", name: "Carthago Z", breed: "Holsteiner", id: "DEU 321210021987" },
  { label: "Maternal granddam", name: "Tangra S van het Darohof", breed: "Belgisches Warmblut (BWP)", id: "BEL 002W00158416" },
  { label: "4th generation", name: "Grand Veneur · Venue du Tot · Elf III · Miss des Cresles · Capitol I · Perra · Lys de Darmen · Gesina van het Darohof", breed: "Pedigree from passport", id: "" },
];

const vaccinations = [
  { date: "02.05.2026", product: "ProteqFlu", disease: "Influenza", vet: "Tierarztpraxis" },
  { date: "10.06.2026", product: "Equilis Prequenza", disease: "Influenza", vet: "Tierarztpraxis" },
  { date: "22.01.2025", product: "Equilis Te", disease: "Tetanus", vet: "C. Heider" },
  { date: "24.01.2024", product: "Equilis Te", disease: "Tetanus", vet: "C. Heider" },
  { date: "28.12.2023", product: "Equilis Te", disease: "Tetanus", vet: "C. Heider" },
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="rounded-3xl border border-white/10 bg-[#111C2E] p-5 sm:p-7 scroll-mt-28">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export default function MyHorseProfile() {
  return (
    <main className="min-h-screen bg-[#08111F] px-4 pb-24 pt-28 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[4px] text-blue-400">My Horses · Personal Record</p>
            <h1 className="mt-3 text-3xl font-black sm:text-4xl">Emerald van het Ruytershof</h1>
            <p className="mt-2 text-gray-400">Private horse profile — not a sale listing</p>
          </div>
          <a href="/account" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-200 hover:bg-white/10">← Account</a>
        </div>

        <nav className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-[#0B1422] p-2">
          {["Overview", "Pedigree", "Vaccinations", "Medical", "Breeding", "Documents", "Training", "Notes"].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="whitespace-nowrap rounded-xl px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white">{item}</a>
          ))}
        </nav>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Section id="overview" title="Overview">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Date of birth", "27.03.2023"],
                ["Breed", "Belgisches Warmblut (BWP)"],
                ["Gender", "Mare"],
                ["Colour", "Fuchs"],
                ["Height", "168 cm"],
                ["UELN / Life number", "276481810084923"],
                ["Transponder", "276020000825800"],
                ["Studbook", "Deutsches Sportpferd"],
                ["Country of birth", "Deutschland"],
                ["Passport", "Equidenpass / Zuchtbescheinigung"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-[#0B1422] p-4">
                  <p className="text-xs text-gray-500">{label}</p>
                  <p className="mt-1 break-words font-semibold text-white">{value}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="pedigree" title="Pedigree">
            <div className="space-y-3">
              {pedigree.map((item) => (
                <div key={`${item.label}-${item.name}`} className="rounded-2xl border border-white/10 bg-[#0B1422] p-4">
                  <p className="text-[11px] uppercase tracking-wider text-blue-400">{item.label}</p>
                  <p className="mt-1 font-semibold text-white">{item.name}</p>
                  <p className="mt-1 text-sm text-gray-400">{item.breed}</p>
                  {item.id ? <p className="mt-1 text-xs text-gray-500">{item.id}</p> : null}
                </div>
              ))}
            </div>
          </Section>

          <Section id="vaccinations" title="Vaccinations">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-gray-500">
                  <tr><th className="pb-3">Date</th><th className="pb-3">Vaccine</th><th className="pb-3">Disease</th><th className="pb-3">Veterinarian</th></tr>
                </thead>
                <tbody>
                  {vaccinations.map((v) => <tr key={`${v.date}-${v.product}`} className="border-t border-white/10"><td className="py-3 text-gray-300">{v.date}</td><td className="py-3 font-semibold text-white">{v.product}</td><td className="py-3 text-gray-300">{v.disease}</td><td className="py-3 text-gray-400">{v.vet}</td></tr>)}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="medical" title="Medical">
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#0B1422] p-5 text-sm text-gray-400">No medical records added yet. Add examinations, treatments, medication, laboratory results and X-rays here.</div>
          </Section>

          <Section id="breeding" title="Breeding">
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#0B1422] p-5 text-sm text-gray-400">Keep breeding events, insemination dates, stallion, ultrasound checks, pregnancy status and expected foaling date here.</div>
          </Section>

          <Section id="documents" title="Documents">
            <div className="grid gap-3 sm:grid-cols-2">
              {["Equidenpass", "Zuchtbescheinigung", "Vaccination pages", "Pedigree pages"].map((doc) => <div key={doc} className="rounded-2xl border border-white/10 bg-[#0B1422] p-4"><p className="font-semibold">{doc}</p><p className="mt-1 text-xs text-gray-500">Passport scan / document</p></div>)}
            </div>
          </Section>

          <Section id="training" title="Training">
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#0B1422] p-5 text-sm text-gray-400">Training sessions, competitions, results and milestones will be stored here.</div>
          </Section>

          <Section id="notes" title="Notes">
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#0B1422] p-5 text-sm text-gray-400">Private notes about the horse, routines, equipment and care.</div>
          </Section>
        </div>
      </div>
    </main>
  );
}
