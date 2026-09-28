"use client";

import { useRef, useState } from "react";

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

export default function HorsePassportScanner({ horseId }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [data, setData] = useState<ExtractedData | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

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

  return (
    <div className="mt-5 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 sm:p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-blue-200">AI passport scanner</p>
          <p className="mt-1 text-sm text-blue-100/70">
            Photograph the passport pages. AI reads the visible data and lets you verify it before saving.
          </p>
        </div>
        <span className="rounded-full bg-blue-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-300">
          Human verification required
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
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
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Scanning…" : "Scan passport"}
        </button>
      </div>

      <p className="mt-2 text-xs text-gray-500">Up to 5 JPG, PNG or WebP pages · 20 MB total.</p>

      {files.length > 0 ? (
        <p className="mt-2 text-xs text-gray-400">{files.length} page{files.length === 1 ? "" : "s"} selected.</p>
      ) : null}

      {error ? <p className="mt-4 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-300">{error}</p> : null}
      {saved ? <p className="mt-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-300">Passport data saved to this horse profile.</p> : null}

      {data ? (
        <div className="mt-5 rounded-2xl border border-white/10 bg-[#0B1422] p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-white">Review extracted data</p>
              <p className="mt-1 text-xs text-gray-500">Correct anything the AI read incorrectly, then confirm.</p>
            </div>
            {typeof data.confidence === "number" ? (
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs font-semibold text-gray-300">
                Confidence {Math.round(data.confidence * 100)}%
              </span>
            ) : null}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {FIELDS.map(([key, label]) => (
              <label key={key} className="block">
                <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</span>
                <input
                  value={data[key] == null ? "" : String(data[key])}
                  onChange={(event) => updateField(key, event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#08111F] px-3 py-2.5 text-sm text-white outline-none focus:border-blue-500/50"
                />
              </label>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setData(null)}
              disabled={busy}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-gray-300 hover:bg-white/10 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirm}
              disabled={busy}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Saving…" : "Confirm & save"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
