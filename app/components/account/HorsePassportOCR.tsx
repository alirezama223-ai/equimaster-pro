"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { confirmPersonalHorseExtraction, uploadPersonalHorseDocument } from "@/app/actions/personal-horse-documents";

type Extraction = Record<string, unknown>;

const fields: Array<[string, string]> = [
  ["name", "Horse name"], ["birth_date", "Date of birth"], ["sex", "Sex"], ["breed", "Breed"], ["color", "Colour"],
  ["height_cm", "Height (cm)"], ["ueln", "UELN"], ["microchip", "Microchip"], ["registration_number", "Registration number"],
  ["sire", "Sire"], ["dam", "Dam"], ["dam_sire", "Dam sire"], ["breeder", "Breeder"], ["issuing_organization", "Issuing organization"],
];

export default function HorsePassportOCR({ horseId }: { horseId: string }) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [extraction, setExtraction] = useState<Extraction | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  async function analyze() {
    if (!files.length) return;
    setBusy(true); setMessage(null); setSaved(false); setConfirmed(false); setDocumentId(null);
    try {
      const body = new FormData();
      for (const file of files) body.append("file", file);
      const response = await fetch("/api/horse-pass/extract", { method: "POST", body });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error || "Passport analysis failed.");
      setExtraction(payload.data as Extraction);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Passport analysis failed."); }
    finally { setBusy(false); }
  }

  async function saveForReview() {
    if (!extraction || !files.length) return;
    setBusy(true); setMessage(null);
    try {
      const form = new FormData();
      form.set("horse_id", horseId); form.set("document_type", "passport"); form.set("file", files[0]); form.set("extracted_data", JSON.stringify(extraction));
      const result = await uploadPersonalHorseDocument(form);
      if (!result.ok || !result.documentId) throw new Error(result.error || "Could not save passport.");
      setDocumentId(result.documentId); setSaved(true); setMessage("Saved for review. Nothing has been written to the horse profile yet.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not save passport."); }
    finally { setBusy(false); }
  }

  async function confirm() {
    if (!documentId) return;
    setBusy(true); setMessage(null);
    try {
      const form = new FormData(); form.set("document_id", documentId);
      const result = await confirmPersonalHorseExtraction(form);
      if (!result.ok) throw new Error(result.error || "Could not confirm extraction.");
      setConfirmed(true); setMessage("Confirmed. Verified fields are now stored in the horse record.");
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not confirm extraction."); }
    finally { setBusy(false); }
  }

  return (
    <section className="rounded-3xl border border-blue-500/20 bg-[#111C2E] p-5 sm:p-7">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[4px] text-blue-400">AI Passport Scan</p><h2 className="mt-2 text-xl font-bold text-white">Scan → Review → Confirm</h2><p className="mt-2 text-sm text-gray-400">Upload up to 5 passport pages. AI suggestions remain separate until you confirm them.</p></div>
        <span className="rounded-full border border-white/10 bg-[#0B1422] px-3 py-1 text-xs text-gray-400">Human verification required</span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <label className="text-sm text-gray-300">Passport pages<input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event)=>{setFiles(Array.from(event.target.files ?? []).slice(0,5));setExtraction(null);setSaved(false);setConfirmed(false);setDocumentId(null);setMessage(null);}} className="mt-2 block w-full rounded-xl border border-white/10 bg-[#0B1422] px-3 py-2 text-sm text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-white" /></label>
        <button type="button" onClick={analyze} disabled={!files.length || busy} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Analyzing…" : `Analyze ${files.length ? `(${files.length})` : ""}`}</button>
      </div>
      {extraction ? <div className="mt-6 rounded-2xl border border-white/10 bg-[#0B1422] p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-semibold text-white">Extracted data</h3><p className="text-xs text-gray-500">Check every value against the passport before confirmation.</p></div>{typeof extraction.confidence === "number" ? <span className="text-xs text-blue-300">AI confidence: {Math.round(Number(extraction.confidence)*100)}%</span> : null}</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">{fields.map(([key,label])=><label key={key} className="text-xs text-gray-500">{label}<input readOnly value={extraction[key] == null ? "" : String(extraction[key])} className="mt-1 w-full rounded-xl border border-white/10 bg-[#111C2E] px-3 py-2 text-sm text-white" /></label>)}</div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-amber-300">Step 1 saves the source and AI result for review. Step 2 writes the confirmed fields to your private horse record.</p><div className="flex gap-2"><button type="button" onClick={saveForReview} disabled={busy || saved} className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{saved ? "Saved ✓" : "Save for review"}</button>{saved ? <button type="button" onClick={confirm} disabled={busy || confirmed} className="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{confirmed ? "Confirmed ✓" : "Confirm & update"}</button> : null}</div></div>
      </div> : null}
      {message ? <p className="mt-4 rounded-xl border border-white/10 bg-[#0B1422] px-4 py-3 text-sm text-gray-300">{message}</p> : null}
    </section>
  );
}
