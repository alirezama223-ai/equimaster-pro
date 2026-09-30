"use client";

import { ChangeEvent, useState } from "react";
import { createWorker } from "tesseract.js";

type FieldName =
  | "name"
  | "birth_date"
  | "gender"
  | "breed"
  | "color"
  | "height_cm"
  | "country_of_birth"
  | "passport_number"
  | "ueln"
  | "microchip";

const FIELD_LABELS: Record<FieldName, string> = {
  name: "Horse name",
  birth_date: "Date of birth",
  gender: "Gender",
  breed: "Breed",
  color: "Colour",
  height_cm: "Height",
  country_of_birth: "Country of birth",
  passport_number: "Passport number",
  ueln: "UELN / life number",
  microchip: "Transponder / microchip",
};

function normalize(value: string) {
  return value.replace(/\s+/g, " ").replace(/[|]/g, " ").trim();
}

function setField(name: FieldName, value: string) {
  if (!value) return false;
  const element = document.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${name}"]`);
  if (!element) return false;
  const setter = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(element),
    "value",
  )?.set;
  setter?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
  return true;
}

function findAfterLabel(text: string, labels: string[]) {
  const lines = text
    .split(/\n+/)
    .map(normalize)
    .filter(Boolean);

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (!labels.some((label) => lower.includes(label))) continue;
    const separator = line.search(/[:=]/);
    if (separator >= 0) {
      const value = normalize(line.slice(separator + 1));
      if (value.length > 1) return value;
    }
  }
  return "";
}

function parseDate(text: string) {
  const match = text.match(/\b(\d{1,2})[./-](\d{1,2})[./-](\d{4})\b/);
  if (!match) return "";
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function parsePassport(text: string): Partial<Record<FieldName, string>> {
  const normalized = text.replace(/\r/g, "");
  const compact = normalized.replace(/\s+/g, " ");
  const result: Partial<Record<FieldName, string>> = {};

  const birthDate =
    findAfterLabel(normalized, ["birth date", "date of birth", "geburtsdatum", "geburtsdat"]) ||
    parseDate(findAfterLabel(normalized, ["geburtsdatum", "date of birth"]));
  if (birthDate) result.birth_date = parseDate(birthDate) || birthDate;

  const name = findAfterLabel(normalized, ["name of the horse", "name des tieres", "name und rasse", "name"]) ||
    normalized.match(/(?:name und rasse|name of the horse)\s*[:\n]\s*([^\n]+)/i)?.[1] || "";
  if (name) result.name = normalize(name).split(/\s{2,}/)[0];

  const breed = findAfterLabel(normalized, ["breed", "rasse", "race"]);
  if (breed) result.breed = normalize(breed);

  const sex = findAfterLabel(normalized, ["sex", "geschlecht"]);
  if (sex) {
    const value = sex.toLowerCase();
    if (/mare|stute|weiblich/.test(value)) result.gender = "Mare";
    else if (/stallion|hengst|männlich/.test(value)) result.gender = "Stallion";
    else if (/gelding|wallach/.test(value)) result.gender = "Gelding";
  }

  const color = findAfterLabel(normalized, ["colour", "color", "farbe"]);
  if (color) result.color = normalize(color);

  const country = findAfterLabel(normalized, ["country of birth", "geburtsort und -land", "geburtsort und land", "birthplace and country"]);
  if (country) result.country_of_birth = normalize(country);

  const height = findAfterLabel(normalized, ["height", "stockmaß", "stockmass"]);
  const heightMatch = `${height} ${compact}`.match(/\b(1[3-9]\d|20\d)\s*(?:cm|centimeter|cm\b)/i);
  if (heightMatch) result.height_cm = heightMatch[1];

  const uelnMatch = compact.match(/\b(\d{15})\b/);
  if (uelnMatch) result.ueln = uelnMatch[1];

  const passport =
    findAfterLabel(normalized, ["passport number", "passport no", "passnummer", "pass-nr", "identification number"]) ||
    compact.match(/(?:passport\s*(?:number|no\.?|nr\.?|#)|passnummer|pass[- ]?nr\.?)\s*[:#-]?\s*([A-Z0-9-]{5,})/i)?.[1] ||
    "";
  if (passport) result.passport_number = normalize(passport);

  const chip =
    findAfterLabel(normalized, ["transponder", "microchip", "transponder-code", "transponder code", "chip number"]) ||
    compact.match(/(?:transponder|microchip|chip)\s*(?:code|number|nr\.?)?\s*[:#-]?\s*(\d{10,20})/i)?.[1] ||
    "";
  if (chip) result.microchip = normalize(chip);

  // German horse passports often put the UELN in a dedicated identification box.
  if (!result.ueln) {
    const labeledUeln = compact.match(/(?:lebensnummer|life number|ueln|identifizierungsnummer)\s*[:#-]?\s*([0-9A-Z]{12,20})/i)?.[1];
    if (labeledUeln) result.ueln = labeledUeln;
  }

  return result;
}

function preprocessImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const url = URL.createObjectURL(file);
    image.onload = () => {
      try {
        const maxWidth = 2400;
        const scale = Math.min(1, maxWidth / image.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("Canvas unavailable");
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
        for (let i = 0; i < pixels.data.length; i += 4) {
          const gray = Math.min(255, Math.max(0, pixels.data[i] * 0.299 + pixels.data[i + 1] * 0.587 + pixels.data[i + 2] * 0.114));
          const contrast = (gray - 128) * 1.35 + 128;
          pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = contrast;
        }
        ctx.putImageData(pixels, 0, 0);
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not process image"))), "image/jpeg", 0.92);
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read image"));
    };
    image.src = url;
  });
}

export default function PassportOcr() {
  const [fileName, setFileName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [found, setFound] = useState<FieldName[]>([]);

  async function scan(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setMessage("");
    setFound([]);
    setBusy(true);

    try {
      const image = await preprocessImage(file);
      const worker = await createWorker("deu+eng");
      const { data } = await worker.recognize(image);
      await worker.terminate();

      const parsed = parsePassport(data.text);
      const filled = (Object.entries(parsed) as [FieldName, string][])
        .filter(([, value]) => Boolean(value))
        .filter(([field, value]) => setField(field, value))
        .map(([field]) => field);

      setFound(filled);
      setMessage(
        filled.length
          ? `${filled.length} fields were detected. Please check them before saving.`
          : "I could not confidently detect the passport fields. Try a clearer photo of the identification page.",
      );
    } catch (error) {
      console.error(error);
      setMessage("The scan could not be completed. Please try a clearer photo or enter the data manually.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[2.5px] text-cyan-300">Passport scanner</p>
          <h3 className="mt-1 text-lg font-bold text-white">Upload a passport photo — fill the form automatically</h3>
          <p className="mt-1 max-w-xl text-xs leading-5 text-gray-400">Choose a clear photo of the identification page. OCR runs in your browser; the image is not uploaded to the server. You can correct anything before creating the horse record.</p>
        </div>
        <label className={`shrink-0 cursor-pointer rounded-xl px-4 py-3 text-center text-sm font-bold text-white ${busy ? "bg-gray-600" : "bg-cyan-600 hover:bg-cyan-500"}`}>
          {busy ? "Reading passport…" : "Choose passport photo"}
          <input type="file" accept="image/*" capture="environment" onChange={scan} disabled={busy} className="sr-only" />
        </label>
      </div>
      {fileName && <p className="mt-3 text-xs text-gray-500">Selected: {fileName}</p>}
      {message && <p className="mt-3 rounded-xl border border-white/10 bg-[#0B1422] px-3 py-2.5 text-xs text-gray-300">{message}</p>}
      {found.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {found.map((field) => <span key={field} className="rounded-full bg-cyan-400/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-200">✓ {FIELD_LABELS[field]}</span>)}
        </div>
      )}
    </div>
  );
}
