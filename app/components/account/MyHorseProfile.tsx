"use client";

import { Link } from "@/i18n/navigation";
import HorsePassportScanner from "@/app/components/account/HorsePassportScanner";

type Horse = {
  id: string;
  name: string;
  birth_date: string | null;
  breed: string | null;
  gender: string | null;
  color: string | null;
  height_cm: number | null;
  ueln: string | null;
  microchip: string | null;
  country_of_birth: string | null;
  studbook: string | null;
  passport_number: string | null;
  notes?: string | null;
};
type PedigreeEntry = { name: string; breed: string; registration_number: string; sex: string; sire?: string; dam?: string };
type Vaccination = { date: string; product: string; disease?: string; batch?: string; note?: string; nextDue?: string };
type VetVisit = { id: string; visit_date: string; reason?: string | null; diagnosis?: string | null; treatment?: string | null; follow_up_date?: string | null; notes?: string | null };
type BreedingEvent = { id: string; event_date: string; event_type: string; stallion_name?: string | null; method?: string | null; pregnancy_status?: string | null; ultrasound_date?: string | null; expected_foaling_date?: string | null; foaling_date?: string | null; notes?: string | null };
type HorseDocument = { id: string; type: string; filename: string; status: string; createdAt: string; url: string | null; extractedData: Record<string, unknown> };
type Action = (formData: FormData) => Promise<void>;

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return <section id={id} className="scroll-mt-28 rounded-3xl border border-white/10 bg-[#111C2E] p-5 sm:p-7"><h2 className="text-xl font-bold text-white">{title}</h2><div className="mt-5">{children}</div></section>;
}
function Input({ name, placeholder, type = "text", required = false }: { name: string; placeholder: string; type?: string; required?: boolean }) {
  return <input name={name} type={type} placeholder={placeholder} required={required} className="w-full rounded-xl border border-white/10 bg-[#0B1422] px-3 py-2.5 text-sm text-white outline-none placeholder:text-gray-600 focus:border-blue-500/50" />;
}
function FormShell({ children, action }: { children: React.ReactNode; action: Action }) {
  return <form action={action} className="rounded-2xl border border-white/10 bg-[#0B1422] p-4"><div className="grid gap-3 sm:grid-cols-2">{children}</div></form>;
}
function PedigreeCard({ item, label }: { item: PedigreeEntry; label: string }) {
  return <div className="min-w-[220px] rounded-2xl border border-white/10 bg-[#0B1422] p-4"><p className="text-[10px] font-semibold uppercase tracking-[2px] text-blue-400">{label}</p><p className="mt-2 font-semibold text-white">{item.name}</p><p className="mt-1 text-xs text-gray-400">{item.breed}</p><p className="mt-1 text-[11px] text-gray-500">{item.registration_number}</p></div>;
}
function DocumentTypeLabel({ type }: { type: string }) {
  const labels: Record<string, string> = { passport: "Equidenpass", pedigree: "Pedigree / Zuchtbescheinigung", vaccination: "Vaccination", veterinary: "Veterinary", breeding: "Breeding", other: "Other" };
  return <span>{labels[type] ?? type}</span>;
}

export default function MyHorseProfile({
  horse, sireLine, vaccinations, vetVisits, breedingEvents, documents,
  addVaccination, addVetVisit, addBreedingEvent, uploadDocument, deleteDocument, updateNotes,
}: {
  horse: Horse;
  sireLine: PedigreeEntry[];
  vaccinations: Vaccination[];
  vetVisits: VetVisit[];
  breedingEvents: BreedingEvent[];
  documents: HorseDocument[];
  addVaccination: Action;
  addVetVisit: Action;
  addBreedingEvent: Action;
  uploadDocument: Action;
  deleteDocument: Action;
  updateNotes: Action;
}) {
  const byName = new Map(sireLine.map((item) => [item.name, item]));
  const sire = byName.get("Emerald van het Ruytershof");
  const grandparents = [byName.get(sire?.sire ?? ""), byName.get(sire?.dam ?? "")].filter(Boolean) as PedigreeEntry[];
  const greatGrandparents = ["Le Tot de Semilly", "Venise des Cresles", "Carthago Z", "Tangra S van het Darohof"].map((name) => byName.get(name)).filter(Boolean) as PedigreeEntry[];
  const pedigreeSections: Array<{ label: string; items: PedigreeEntry[] }> = [
    { label: "Sire", items: sire ? [sire] : [] },
    { label: "Grandparents", items: grandparents },
    { label: "Great-grandparents", items: greatGrandparents },
  ];

  return <main className="min-h-screen bg-[#08111F] px-4 pb-24 pt-28 text-white"><div className="mx-auto max-w-6xl">
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[4px] text-blue-400">My Horses · Personal Record</p><h1 className="mt-3 text-3xl font-black sm:text-4xl">{horse.name}</h1><p className="mt-2 text-gray-400">Private horse profile — not a sale listing</p></div>
      <Link href="/account" className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-200 hover:bg-white/10">← Account</Link>
    </div>
    <nav className="mb-6 flex gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-[#0B1422] p-2">{["Overview","Pedigree","Vaccinations","Medical","Breeding","Documents","Training","Notes"].map((item) => <a key={item} href={`#${item.toLowerCase()}`} className="whitespace-nowrap rounded-xl px-3 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white">{item}</a>)}</nav>
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <Section id="overview" title="Overview"><div className="grid gap-3 sm:grid-cols-2">{[
        ["Date of birth", horse.birth_date ? new Date(`${horse.birth_date}T00:00:00`).toLocaleDateString("de-DE") : "—"], ["Breed", horse.breed ?? "—"], ["Gender", horse.gender ?? "—"], ["Colour", horse.color ?? "—"], ["Height", horse.height_cm ? `${horse.height_cm} cm` : "—"], ["UELN / Life number", horse.ueln ?? "—"], ["Transponder", horse.microchip ?? "—"], ["Studbook", horse.studbook ?? "—"], ["Country of birth", horse.country_of_birth ?? "—"], ["Passport", horse.passport_number ?? "Not entered yet"],
      ].map(([label, value]) => <div key={label} className="rounded-2xl border border-white/10 bg-[#0B1422] p-4"><p className="text-xs text-gray-500">{label}</p><p className="mt-1 break-words font-semibold text-white">{value}</p></div>)}</div></Section>

      <Section id="pedigree" title="Pedigree"><div className="space-y-4">{pedigreeSections.map(({ label, items }) => <div key={label}><p className="mb-2 text-[11px] font-semibold uppercase tracking-[2px] text-gray-500">{label}</p><div className="flex gap-3 overflow-x-auto pb-1">{items.map((item) => <PedigreeCard key={item.name} item={item} label={label === "Sire" ? "Father" : "Ancestor"} />)}</div></div>)}</div><p className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-200">The maternal line is not guessed. Add the mother from the passport when you have her details and we can connect the missing branches accurately.</p></Section>

      <Section id="vaccinations" title="Vaccinations"><div className="space-y-3">{vaccinations.map((item) => <div key={`${item.date}-${item.product}`} className="rounded-2xl border border-white/10 bg-[#0B1422] p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-semibold text-white">{item.product}</p><p className="mt-1 text-sm text-gray-400">{item.disease || "Vaccination"}</p></div><span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300">{new Date(`${item.date}T00:00:00`).toLocaleDateString("de-DE")}</span></div>{item.batch && <p className="mt-2 text-xs text-gray-500">Batch: {item.batch}</p>}{item.nextDue && <p className="mt-1 text-xs text-gray-500">Next due: {new Date(`${item.nextDue}T00:00:00`).toLocaleDateString("de-DE")}</p>}{item.note && <p className="mt-2 text-xs text-gray-500">{item.note}</p>}</div>)}</div><div className="mt-5"><p className="mb-3 text-sm font-semibold text-gray-300">＋ Add vaccination</p><FormShell action={addVaccination}><input type="hidden" name="horse_id" value={horse.id}/><Input name="vaccine_name" placeholder="Vaccine name" required/><Input name="administered_date" type="date" placeholder="Date" required/><Input name="next_due_date" type="date" placeholder="Next due"/><Input name="batch_number" placeholder="Batch number"/><input name="notes" placeholder="Notes / disease" className="sm:col-span-2 w-full rounded-xl border border-white/10 bg-[#08111F] px-3 py-2.5 text-sm text-white outline-none placeholder:text-gray-600"/><button className="sm:col-span-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500">Save vaccination</button></FormShell></div></Section>

      <Section id="medical" title="Medical"><div className="space-y-3">{vetVisits.length === 0 ? <p className="rounded-2xl border border-dashed border-white/10 bg-[#0B1422] p-5 text-sm text-gray-500">No veterinary visits recorded yet.</p> : vetVisits.map((visit) => <div key={visit.id} className="rounded-2xl border border-white/10 bg-[#0B1422] p-4"><div className="flex justify-between gap-3"><p className="font-semibold">{visit.reason || "Veterinary visit"}</p><span className="text-xs text-gray-500">{new Date(`${visit.visit_date}T00:00:00`).toLocaleDateString("de-DE")}</span></div>{visit.diagnosis && <p className="mt-2 text-sm text-gray-300">Diagnosis: {visit.diagnosis}</p>}{visit.treatment && <p className="mt-1 text-sm text-gray-400">Treatment: {visit.treatment}</p>}{visit.follow_up_date && <p className="mt-1 text-xs text-blue-300">Follow-up: {new Date(`${visit.follow_up_date}T00:00:00`).toLocaleDateString("de-DE")}</p>}{visit.notes && <p className="mt-2 text-xs text-gray-500">{visit.notes}</p>}</div>)}</div><div className="mt-5"><p className="mb-3 text-sm font-semibold text-gray-300">＋ Add veterinary visit</p><FormShell action={addVetVisit}><input type="hidden" name="horse_id" value={horse.id}/><Input name="visit_date" type="date" placeholder="Date" required/><Input name="reason" placeholder="Reason"/><Input name="diagnosis" placeholder="Diagnosis"/><Input name="treatment" placeholder="Treatment"/><Input name="follow_up_date" type="date" placeholder="Follow-up date"/><input name="notes" placeholder="Notes" className="sm:col-span-2 w-full rounded-xl border border-white/10 bg-[#08111F] px-3 py-2.5 text-sm text-white outline-none placeholder:text-gray-600"/><button className="sm:col-span-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500">Save visit</button></FormShell></div></Section>

      <Section id="breeding" title="Breeding"><div className="space-y-3">{breedingEvents.length === 0 ? <p className="rounded-2xl border border-dashed border-white/10 bg-[#0B1422] p-5 text-sm text-gray-500">No breeding events recorded yet.</p> : breedingEvents.map((event) => <div key={event.id} className="rounded-2xl border border-white/10 bg-[#0B1422] p-4"><div className="flex justify-between gap-3"><div><p className="font-semibold capitalize">{event.event_type.replaceAll("_", " ")}</p>{event.stallion_name && <p className="mt-1 text-sm text-gray-300">Stallion: {event.stallion_name}</p>}</div><span className="text-xs text-gray-500">{new Date(`${event.event_date}T00:00:00`).toLocaleDateString("de-DE")}</span></div>{event.method && <p className="mt-2 text-sm text-gray-400">Method: {event.method}</p>}{event.pregnancy_status && <p className="mt-1 text-sm text-blue-300">Pregnancy: {event.pregnancy_status}</p>}{event.ultrasound_date && <p className="mt-1 text-xs text-gray-500">Ultrasound: {new Date(`${event.ultrasound_date}T00:00:00`).toLocaleDateString("de-DE")}</p>}{event.expected_foaling_date && <p className="mt-1 text-xs text-gray-500">Expected foaling: {new Date(`${event.expected_foaling_date}T00:00:00`).toLocaleDateString("de-DE")}</p>}{event.foaling_date && <p className="mt-1 text-xs text-gray-500">Foaling: {new Date(`${event.foaling_date}T00:00:00`).toLocaleDateString("de-DE")}</p>}{event.notes && <p className="mt-2 text-xs text-gray-500">{event.notes}</p>}</div>)}</div><div className="mt-5"><p className="mb-3 text-sm font-semibold text-gray-300">＋ Add breeding event</p><FormShell action={addBreedingEvent}><input type="hidden" name="horse_id" value={horse.id}/><Input name="event_date" type="date" placeholder="Event date" required/><select name="event_type" defaultValue="insemination" className="w-full rounded-xl border border-white/10 bg-[#0B1422] px-3 py-2.5 text-sm text-white"><option value="insemination">Insemination</option><option value="covering">Covering</option><option value="ultrasound">Ultrasound</option><option value="pregnancy_check">Pregnancy check</option><option value="foaling">Foaling</option><option value="other">Other</option></select><Input name="stallion_name" placeholder="Stallion"/><Input name="method" placeholder="Method / semen"/><Input name="pregnancy_status" placeholder="Pregnancy status"/><Input name="ultrasound_date" type="date" placeholder="Ultrasound date"/><Input name="expected_foaling_date" type="date" placeholder="Expected foaling"/><Input name="foaling_date" type="date" placeholder="Foaling date"/><input name="notes" placeholder="Notes" className="sm:col-span-2 w-full rounded-xl border border-white/10 bg-[#08111F] px-3 py-2.5 text-sm text-white outline-none placeholder:text-gray-600"/><button className="sm:col-span-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500">Save breeding event</button></FormShell></div></Section>

      <Section id="documents" title="Documents">
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4"><p className="font-semibold text-blue-200">Private horse document vault</p><p className="mt-1 text-sm text-blue-100/70">Upload the Equidenpass, pedigree pages, vaccination pages, veterinary reports and breeding documents. Files stay private to this horse owner.</p></div>
        <HorsePassportScanner horseId={horse.id} />
        <form action={uploadDocument} encType="multipart/form-data" className="mt-5 rounded-2xl border border-white/10 bg-[#0B1422] p-4"><input type="hidden" name="horse_id" value={horse.id}/><div className="grid gap-3 sm:grid-cols-2"><select name="document_type" defaultValue="passport" className="w-full rounded-xl border border-white/10 bg-[#08111F] px-3 py-2.5 text-sm text-white"><option value="passport">Equidenpass</option><option value="pedigree">Pedigree / Zuchtbescheinigung</option><option value="vaccination">Vaccination</option><option value="veterinary">Veterinary</option><option value="breeding">Breeding</option><option value="other">Other</option></select><input name="document" type="file" required accept="application/pdf,image/jpeg,image/png,image/webp" className="w-full rounded-xl border border-white/10 bg-[#08111F] px-3 py-2 text-sm text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"/><p className="sm:col-span-2 text-xs text-gray-500">PDF, JPG, PNG or WebP · maximum 25 MB</p><button className="sm:col-span-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500">＋ Upload document</button></div></form>
        <div className="mt-5 space-y-3">{documents.length === 0 ? <p className="rounded-2xl border border-dashed border-white/10 bg-[#0B1422] p-5 text-sm text-gray-500">No private documents uploaded yet.</p> : documents.map((document) => <div key={document.id} className="rounded-2xl border border-white/10 bg-[#0B1422] p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="truncate font-semibold text-white">{document.filename}</p><span className="rounded-full bg-white/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400"><DocumentTypeLabel type={document.type}/></span><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${document.status === "confirmed" ? "bg-emerald-500/10 text-emerald-300" : document.status === "failed" ? "bg-red-500/10 text-red-300" : "bg-amber-500/10 text-amber-300"}`}>{document.status === "pending" ? "AI extraction pending" : document.status}</span></div><p className="mt-1 text-xs text-gray-500">Uploaded {new Date(document.createdAt).toLocaleDateString("de-DE")}</p></div><div className="flex shrink-0 gap-2">{document.url && <a href={document.url} target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-gray-200 hover:bg-white/10">Open</a>}<form action={deleteDocument}><input type="hidden" name="document_id" value={document.id}/><button className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/10">Delete</button></form></div></div>{Object.keys(document.extractedData).length > 0 && <details className="mt-3 rounded-xl border border-white/5 bg-[#08111F] p-3"><summary className="cursor-pointer text-xs font-semibold text-gray-300">Extracted data</summary><pre className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap text-[11px] text-gray-500">{JSON.stringify(document.extractedData, null, 2)}</pre></details>}</div>)}</div>
      </Section>

      <Section id="training" title="Training"><div className="rounded-2xl border border-dashed border-white/10 bg-[#0B1422] p-5 text-sm text-gray-400">Training sessions, competitions, results and milestones will be linked to this horse next.</div></Section>
      <Section id="notes" title="Notes"><form action={updateNotes}><input type="hidden" name="horse_id" value={horse.id}/><textarea name="notes" defaultValue={horse.notes ?? ""} placeholder="Private notes about the horse, routines..." className="min-h-40 w-full rounded-2xl border border-white/10 bg-[#0B1422] p-4 text-sm text-white outline-none placeholder:text-gray-600 focus:border-blue-500/50"/><button className="mt-3 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-500">Save notes</button></form></Section>
    </div>
  </div></main>;
}
