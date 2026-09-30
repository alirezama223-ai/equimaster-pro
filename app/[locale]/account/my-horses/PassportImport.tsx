"use client";

import { useRef, useState } from "react";
import { createPersonalHorse } from "@/app/actions/personal-horses";

type HorseDraft = {
  name: string;
  birth_date: string;
  gender: string;
  breed: string;
  color: string;
  height_cm: string;
  country_of_birth: string;
  studbook: string;
  passport_number: string;
  ueln: string;
  microchip: string;
  notes: string;
};

const emptyDraft: HorseDraft = {
  name: "",
  birth_date: "",
  gender: "",
  breed: "",
  color: "",
  height_cm: "",
  country_of_birth: "",
  studbook: "",
  passport_number: "",
  ueln: "",
  microchip: "",
  notes: "",
};

function Input({ name, label, type = "text", value, onChange }: { name: keyof HorseDraft; label: string; type?: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-gray-400">{label}</span>
      <input name={name} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0B1422] px-3 py-2.5 text-sm text-white outline-none placeholder:text-gray-600 focus:border-blue-500/50" />
    </label>
  );
}

export default function PassportImport() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<HorseDraft>(emptyDraft);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const set = (key: keyof HorseDraft) => (value: string) => setDraft((current) => ({ ...current, [key]: value }));

  async function extractPassport(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const response = await fetch("/api/horse-passport/extract", { method: "POST", body: formData });
    const result = await response.json();
    if (!response.ok) throw new Error(result?.error || "Could not read the passport.");
    setDraft((current) => ({ ...current, ...result.fields }));
  }

  async function handleFiles(files: File[]) {
    if (!files.length) return;

    const invalid = files.find((file) => !file.type.startsWith("image/"));
    if (invalid) {
      setError(`"${invalid.name}" is not an image. Please choose JPG, PNG or WEBP files.`);
      return;
    }

    const tooLarge = files.find((file) => file.size > 10 * 1024 * 1024);
    if (tooLarge) {
      setError(`"${tooLarge.name}" is larger than 10 MB.`);
      return;
    }

    if (files.length > 10) {
      setError("You can upload up to 10 passport photos at once.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage(`Reading 0 of ${files.length} passport photos…`);
    setFileNames(files.map((file) => file.name));

    let completed = 0;
    const failed: string[] = [];

    try {
      // Process one photo at a time so several passport pages can be uploaded
      // without exceeding the server request-size limit. Later pages can fill
      // fields that were not visible in earlier pages.
      for (const file of files) {
        try {
          await extractPassport(file);
        } catch {
          failed.push(file.name);
        }
        completed += 1;
        setMessage(`Reading ${completed} of ${files.length} passport photos…`);
      }

      if (failed.length) {
        setError(`Could not read: ${failed.join(", ")}. The other photos were processed.`);
      }
      setMessage(failed.length ? `Finished reading ${files.length - failed.length} of ${files.length} photos. Please check the fields.` : `All ${files.length} passport photos were read. Please check the fields before saving.`);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    void handleFiles(files);
  }

  return (
    <section className="rounded-3xl border border-blue-400/20 bg-gradient-to-br from-[#14243A] to-[#0B1422] p-5 sm:p-7">
      <div className="mb-5">
        <p className="text-xs font-semibold uppercase tracking-[3px] text-blue-300">＋ New horse</p>
        <h2 className="mt-2 text-2xl font-bold">Add a horse</h2>
        <p className="mt-2 text-sm text-gray-500">Upload one or several clear photos of the horse passport. EquiMaster will read the pages and combine the information for you. You can correct anything before saving.</p>
      </div>

      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFile} className="hidden" />
      <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="w-full rounded-2xl border border-blue-400/30 bg-blue-500/10 px-4 py-4 text-left transition hover:bg-blue-500/15 disabled:opacity-60">
        <span className="block text-sm font-bold text-blue-200">{busy ? "Reading passport photos…" : "📷 Upload passport photos"}</span>
        <span className="mt-1 block text-xs text-gray-400">Select several JPG, PNG or WEBP photos · up to 10 photos · maximum 10 MB each</span>
        {fileNames.length ? (
          <span className="mt-2 block text-xs text-gray-300">
            Selected: {fileNames.length} photo{fileNames.length === 1 ? "" : "s"}
            <span className="mt-1 block text-gray-500">{fileNames.join(" · ")}</span>
          </span>
        ) : null}
      </button>
      {message ? <p className="mt-3 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">{message}</p> : null}
      {error ? <p className="mt-3 rounded-xl bg-red-500/10 px-3 py-2 text-xs text-red-300">{error}</p> : null}

      <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-[2px] text-gray-600"><span className="h-px flex-1 bg-white/10" />Or enter manually<span className="h-px flex-1 bg-white/10" /></div>

      <form action={createPersonalHorse} className="space-y-4">
        <Input name="name" label="Horse name" value={draft.name} onChange={set("name")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input name="birth_date" label="Date of birth" type="date" value={draft.birth_date} onChange={set("birth_date")} />
          <label className="block"><span className="mb-1.5 block text-xs font-semibold text-gray-400">Gender</span><select name="gender" value={draft.gender} onChange={(event) => set("gender")(event.target.value)} className="w-full rounded-xl border border-white/10 bg-[#0B1422] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50"><option value="">Not entered</option><option value="Mare">Mare</option><option value="Stallion">Stallion</option><option value="Gelding">Gelding</option></select></label>
        </div>
        <div className="grid gap-4 sm:grid-cols-2"><Input name="breed" label="Breed" value={draft.breed} onChange={set("breed")} /><Input name="color" label="Colour" value={draft.color} onChange={set("color")} /></div>
        <div className="grid gap-4 sm:grid-cols-2"><Input name="height_cm" label="Height (cm)" type="number" value={draft.height_cm} onChange={set("height_cm")} /><Input name="country_of_birth" label="Country of birth" value={draft.country_of_birth} onChange={set("country_of_birth")} /></div>
        <div className="grid gap-4 sm:grid-cols-2"><Input name="studbook" label="Studbook" value={draft.studbook} onChange={set("studbook")} /><Input name="passport_number" label="Passport number" value={draft.passport_number} onChange={set("passport_number")} /></div>
        <div className="grid gap-4 sm:grid-cols-2"><Input name="ueln" label="UELN / life number" value={draft.ueln} onChange={set("ueln")} /><Input name="microchip" label="Transponder / microchip" value={draft.microchip} onChange={set("microchip")} /></div>
        <label className="block"><span className="mb-1.5 block text-xs font-semibold text-gray-400">Private notes</span><textarea name="notes" value={draft.notes} onChange={(event) => set("notes")(event.target.value)} className="min-h-24 w-full rounded-xl border border-white/10 bg-[#0B1422] p-3 text-sm text-white outline-none placeholder:text-gray-600 focus:border-blue-500/50" placeholder="Anything you want to remember about this horse..." /></label>
        <button disabled={!draft.name || busy} className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50">Create horse record</button>
      </form>
    </section>
  );
}
