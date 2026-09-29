"use client";

import { useEffect, useRef, useState } from "react";

type ExtractedData = Record<string, string | number | null>;

type Props = {
  horseId: string;
};

const FIELDS: Array<[string, string]> = [
  ["name", "Horse name"],
  ["birth_date", "Date of birth"],
  ["sex", "Sex"],
  ["breed", "Breed"],
  ["color", "Colour"],
  ["country", "Country of birth"],
  ["height_cm", "Height (cm)"],
  ["sire", "Sire / Father"],
  ["dam", "Dam / Mother"],
  ["dam_sire", "Dam's sire"],
  ["registration_number", "Registration number"],
  ["ueln", "UELN / Life number"],
  ["microchip", "Microchip / Transponder"],
  ["breeder", "Breeder"],
  ["issuing_organization", "Issuing organization"],
];

const IDENTITY_FIELDS = new Set(["name", "birth_date", "sex", "breed", "color", "country", "height_cm"]);
const PARENTAGE_FIELDS = new Set(["sire", "dam", "dam_sire"]);
const IDENTIFIER_FIELDS = new Set(["registration_number", "ueln", "microchip"]);
const RECORD_FIELDS = new Set(["breeder", "issuing_organization"]);

export default function HorsePassportScanner({ horseId }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [data, setData] = useState<ExtractedData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls(urls);
    return () => urls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  function chooseFiles(event: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setSaved(false);
    setData(null);
    const selected = Array.from(event.target.files ?? []);
    if (selected.length > 5) {
      setError("Please select no more than 5 passport pages.");
      setFiles(selected.slice(0, 5));
      return;
    }
    setFiles(selected);
  }

  async function scan() {
    if (!files.length) {
      setError("Please select at least one passport page.");
      return;
    }

    setBusy(true);
    setError(null);
    setSaved(false);

    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("file", file));
      const response = await fetch("/api/horse-pass/extract", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Passport scan failed.");
      setData(payload.data as ExtractedData);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Passport scan failed.");
    } finally {
      setBusy(false);
    }
  }

  function updateField(key: string, value: string) {
    setData((current) => (current ? { ...current, [key]: value || null } : current));
  }

  async function confirm() {
    if (!data || !files.length) return;
    setBusy(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("horse_id", horseId);
      formData.append("extracted_data", JSON.stringify(data));
      files.forEach((file) => formData.append("file", file));

      const response = await fetch("/api/horse-pass/confirm", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not save the passport data.");

      setSaved(true);
      setData(null);
      setFiles([]);
      if (inputRef.current) inputRef.current.value = "";
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : "Could not save the passport data.");
    } finally {
      setBusy(false);
    }
  }

  const renderFieldGroup = (title: string, keys: Set<string>) => (
    <div className="rounded-2xl border border-white/10 bg-[#08111F] p-4 sm:p-5">
      <div className="mb-4">
        <p className="text-[10px] font-bold uppercase tracking-[2px] text-blue-400">{title}</p>
        <p className="mt-1 text-xs text-gray-500">Editable before saving</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {FIELDS.filter(([key]) => keys.has(key)).map(([key, label]) => (
          <label key={key} className="block">
            <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</span>
            <input
              value={data?.[key] == null ? "" : String(data[key])}
              onChange={(event) => updateField(key, event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#0B1422] px-3 py-2.5 text-sm text-white outline-none transition focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20"
            />
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="mt-5 rounded-3xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-[#0B1422] to-[#08111F] p-4 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-blue-200">AI passport scanner</p>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-300">Human verification required</span>
          </div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100/70">
            Upload the passport pages together. The AI combines the visible information and gives you one clean record to review before anything is saved.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#0B1422] px-4 py-3 lg:min-w-[190px]">
          <p className="text-[10px] font-semibold uppercase tracking-[2px] text-gray-500">Current horse</p>
          <p className="mt-1 text-lg font-black text-white">Emma</p>
          <p className="text-xs text-gray-500">Personal horse record</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={chooseFiles}
          className="w-full rounded-xl border border-white/10 bg-[#08111F] px-3 py-2 text-sm text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
        />
        <button
          type="button"
          onClick={scan}
          disabled={busy || !files.length}
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Scanning…" : "Scan passport"}
        </button>
      </div>

      <p className="mt-2 text-xs text-gray-500">Up to 5 JPG, PNG or WebP pages · 20 MB total.</p>

      {files.length > 0 ? (
        <div className="mt-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-200">Passport pages</p>
              <p className="mt-1 text-xs text-gray-500">Pages are kept in upload order so you can verify page 1 and page 2 visually.</p>
            </div>
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-gray-400">{files.length} / 5</span>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {files.map((file, index) => (
              <div key={`${file.name}-${index}`} className="overflow-hidden rounded-2xl border border-white/10 bg-[#0B1422]">
                <div className="aspect-[3/4] bg-black/20">
                  {previewUrls[index] ? <img src={previewUrls[index]} alt={`Passport page ${index + 1}`} className="h-full w-full object-cover" /> : null}
                </div>
                <div className="border-t border-white/10 px-3 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-[1.5px] text-blue-400">Page {index + 1}</p>
                  <p className="mt-1 truncate text-[11px] text-gray-500">{file.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {error ? <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-300">{error}</p> : null}
      {saved ? <p className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-300">Passport data saved to this horse profile.</p> : null}

      {data ? (
        <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-[#0B1422]">
          <div className="border-b border-white/10 bg-gradient-to-r from-[#14233A] to-[#0B1422] p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[3px] text-blue-400">Passport review</p>
                <h3 className="mt-2 text-2xl font-black text-white">{data.name ? String(data.name) : "Emma"}</h3>
                <p className="mt-1 text-sm text-gray-400">Combined information from the uploaded passport pages</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {typeof data.confidence === "number" ? (
                  <span className="rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-300">Confidence {Math.round(data.confidence * 100)}%</span>
                ) : null}
                <span className="rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300">Review before save</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 p-4 sm:p-6">
            {renderFieldGroup("1 · Identity", IDENTITY_FIELDS)}
            {renderFieldGroup("2 · Parentage", PARENTAGE_FIELDS)}
            {renderFieldGroup("3 · Identification numbers", IDENTIFIER_FIELDS)}
            {renderFieldGroup("4 · Breeder & document", RECORD_FIELDS)}

            <div className="flex flex-col gap-2 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setData(null)}
                disabled={busy}
                className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-300 transition hover:bg-white/10 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={busy}
                className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {busy ? "Saving…" : "Confirm & save"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
