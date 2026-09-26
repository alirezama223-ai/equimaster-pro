"use client";

import { useRef, useState } from "react";
import type { ListingFormData } from "@/app/types/listing";

export type HorsePassportExtraction = {
  name: string | null;
  birth_date: string | null;
  sex: string | null;
  breed: string | null;
  color: string | null;
  country: string | null;
  height_cm: number | null;
  sire: string | null;
  dam: string | null;
  dam_sire: string | null;
  registration_number: string | null;
  ueln: string | null;
  microchip: string | null;
  breeder: string | null;
  issuing_organization: string | null;
  confidence: number | null;
};

type Props = {
  onExtracted: (data: Partial<ListingFormData>) => void;
};

function calculateAge(birthDate: string | null) {
  if (!birthDate) return "";
  const date = new Date(`${birthDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const birthdayPassed =
    today.getMonth() > date.getMonth() ||
    (today.getMonth() === date.getMonth() && today.getDate() >= date.getDate());
  if (!birthdayPassed) age -= 1;
  return age >= 0 && age < 50 ? String(age) : "";
}

function normalizeGender(value: string | null): ListingFormData["gender"] {
  if (!value) return "";
  const normalized = value.trim().toLowerCase();
  if (["mare", "stute", "female"].includes(normalized)) return "Mare";
  if (["stallion", "hengst", "male"].includes(normalized)) return "Stallion";
  if (["gelding", "wallach", "castrated"].includes(normalized)) return "Gelding";
  return "";
}

export default function HorsePassportScanner({ onExtracted }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<HorsePassportExtraction | null>(null);
  const [imageCount, setImageCount] = useState(0);

  async function scan(files: File[]) {
    setError(null);
    setResult(null);
    setImageCount(files.length);
    setIsScanning(true);

    try {
      const body = new FormData();
      for (const file of files) body.append("file", file);

      const response = await fetch("/api/horse-pass/extract", {
        method: "POST",
        body,
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "The passport could not be analyzed.");
      }

      const data = payload.data as HorsePassportExtraction;
      setResult(data);

      const normalizedGender = normalizeGender(data.sex);
      const extracted: Partial<ListingFormData> = {
        ...(data.name ? { name: data.name } : {}),
        ...(data.breed ? { breed: data.breed } : {}),
        ...(data.color ? { color: data.color } : {}),
        ...(data.height_cm != null ? { height: String(Math.round(data.height_cm)) } : {}),
        ...(data.country ? { country: data.country } : {}),
        ...(data.sire ? { sire: data.sire } : {}),
        ...(data.dam ? { dam: data.dam } : {}),
        ...(data.dam_sire ? { damSire: data.dam_sire } : {}),
        ...(data.birth_date ? { age: calculateAge(data.birth_date) } : {}),
        ...(normalizedGender ? { gender: normalizedGender } : {}),
      };

      onExtracted(extracted);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "The passport could not be analyzed.");
    } finally {
      setIsScanning(false);
    }
  }

  return (
    <div className="mb-7 rounded-2xl border border-blue-500/30 bg-blue-500/10 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-white">📷 Daten automatisch erfassen</p>
          <p className="mt-1 text-sm text-gray-400">
            Eine oder mehrere Pferdepass-Seiten fotografieren oder hochladen – SHABDIZ übernimmt die erkannten Daten.
          </p>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isScanning}
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-blue-500 disabled:cursor-wait disabled:opacity-60"
        >
          {isScanning ? "Pass wird analysiert …" : "Pferdepass scannen"}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        multiple
        className="hidden"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          if (files.length > 0) void scan(files);
          event.currentTarget.value = "";
        }}
      />

      {error ? (
        <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
          <p className="text-sm font-semibold text-emerald-300">
            ✓ Daten erkannt – bitte vor dem Speichern prüfen.
            {result.confidence != null ? ` (${Math.round(result.confidence * 100)}% Konfidenz)` : ""}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {imageCount} {imageCount === 1 ? "Seite" : "Seiten"} analysiert
          </p>
          <div className="mt-3 grid gap-2 text-xs text-gray-400 sm:grid-cols-2">
            {result.ueln ? <div>UELN: <span className="text-gray-200">{result.ueln}</span></div> : null}
            {result.registration_number ? <div>Registrierung: <span className="text-gray-200">{result.registration_number}</span></div> : null}
            {result.microchip ? <div>Microchip: <span className="text-gray-200">{result.microchip}</span></div> : null}
            {result.issuing_organization ? <div>Aussteller: <span className="text-gray-200">{result.issuing_organization}</span></div> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
