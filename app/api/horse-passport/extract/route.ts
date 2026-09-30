import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 90;

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeDate(value: string) {
  const match = value.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2}|\d{4})$/);
  if (!match) return "";
  const [, day, month, yearRaw] = match;
  const year = yearRaw.length === 2 ? `20${yearRaw}` : yearRaw;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function normalizeAnyDate(value: unknown) {
  const raw = clean(value).replace(/\s+/g, "");
  return normalizeDate(raw) || (raw.match(/^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/) ? normalizeDate(raw.replace(/-/g, ".").replace(/^\d{4}\.(\d{1,2})\.(\d{1,2})$/, "$3.$2.$1")) : "");
}

function normalizeGender(value: string) {
  const v = value.toLowerCase();
  if (v.includes("mare") || v.includes("stute") || v.includes("weib")) return "Mare";
  if (v.includes("stallion") || v.includes("hengst")) return "Stallion";
  if (v.includes("gelding") || v.includes("wallach")) return "Gelding";
  return "";
}

function emptyResult() {
  return {
    page_type: "other",
    fields: {
      name: "", birth_date: "", gender: "", breed: "", color: "", height_cm: "",
      country_of_birth: "", studbook: "", passport_number: "", ueln: "", microchip: "", notes: "",
    },
    pedigree: [] as any[],
    vaccinations: [] as any[],
  };
}

async function callVision(apiKey: string, imageData: string, focus?: "pedigree" | "vaccination") {
  const focusInstruction = focus === "pedigree"
    ? `This is a SECOND, focused pass. Concentrate almost exclusively on genealogy/pedigree information. Read every visible ancestor name and relationship. If the page gives only the horse's sire and dam, still create a self record containing sire_name and dam_name, plus separate sire and dam records when their names are visible. Never put pedigree data only in notes.`
    : focus === "vaccination"
      ? `This is a SECOND, focused pass. Concentrate almost exclusively on the vaccination table. Read every visible row, including stamped or handwritten entries. Capture the date even when the vaccine/product name is unclear, and put any readable veterinarian, stamp, batch or remark in notes. Never put vaccination data only in notes.`
      : `First classify the page. If it is a pedigree/genealogy page, spend most of the effort extracting the complete family tree. If it is a vaccination page, spend most of the effort extracting every vaccination row. If it is an identity page, extract the horse identity fields. Do not let an easy passport number prevent extraction of the other structured data.`;

  const prompt = `You are a meticulous European horse-passport document extraction assistant. Inspect the WHOLE photographed page at high detail, including small tables, stamps and handwritten/printed entries.

${focusInstruction}

Return ONLY valid JSON with exactly these top-level keys: page_type, fields, pedigree, vaccinations.
page_type must be one of: identity, pedigree, vaccination, medical, other.

fields must contain exactly: name, birth_date, gender, breed, color, height_cm, country_of_birth, studbook, passport_number, ueln, microchip, notes.
pedigree must be an array of zero or more objects. Each object must contain exactly: name, sex, breed, registration_number, relation, sire_name, dam_name. relation must be one of: self, sire, dam, paternal_grandsire, paternal_granddam, maternal_grandsire, maternal_granddam, other.
vaccinations must be an array of zero or more objects. Each object must contain exactly: vaccine_name, administered_date, next_due_date, batch_number, notes.

Rules:
- Extract only information clearly visible on THIS image. Never invent or guess.
- Empty means not visible on this page, not that the passport has no such information elsewhere.
- For identity pages, extract the registered horse name, date of birth, sex, breed/type, colour, height, country of birth, studbook, passport number, UELN/life number and microchip/transponder when labelled.
- German labels may include Name, Name des Pferdes, Stute, Hengst, Wallach, Stockmaß, Zuchtverband, Lebensnummer, UELN, Transponder, Passnummer.
- For pedigree pages, preserve names exactly as printed and capture every clearly readable ancestor. Use a self record when the page identifies the main horse and its sire/dam. If a sire or dam's parents are visible, capture those relationships too.
- For vaccination pages, capture EVERY visible row separately. German labels may include Impfungen, Impfung, Impfdatum, nächste Impfung, Chargennummer, Impfstoff, Tierarzt. Do not discard a row just because one cell is hard to read. If a row has a date but no readable vaccine name, return vaccine_name as an empty string and put the other readable information in notes.
- dates may be written as DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY, DD.MM.YY or ISO. Return dates as YYYY-MM-DD when the day, month and year are clear.
- Do not confuse page numbers, passport numbers, UELN, microchip numbers or dates with vaccination data.
- Do not summarize pedigree or vaccination rows into fields.notes when they can be represented in the structured arrays.

Before returning JSON, inspect the page one more time specifically for small genealogy tables and vaccination rows.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.HORSE_PASS_AI_MODEL || "gpt-4.1",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You extract structured data from horse passport images. Be exhaustive with pedigree and vaccination tables and never invent unreadable data." },
        { role: "user", content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: imageData, detail: "high" } },
        ] },
      ],
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    console.error("Horse passport extraction failed", details);
    throw new Error("The passport could not be read.");
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("The passport reader returned no data.");
  try {
    return JSON.parse(content) as Record<string, unknown>;
  } catch {
    throw new Error("The passport reader returned invalid data.");
  }
}

function normalizeParsed(parsed: Record<string, unknown>) {
  const rawFields = (parsed.fields && typeof parsed.fields === "object" ? parsed.fields : parsed) as Record<string, unknown>;
  const rawDate = clean(rawFields.birth_date);
  const rawHeight = clean(rawFields.height_cm).replace(/[^0-9]/g, "");
  const fields = {
    name: clean(rawFields.name),
    birth_date: normalizeDate(rawDate) || (rawDate.match(/^\d{4}-\d{2}-\d{2}$/) ? rawDate : ""),
    gender: normalizeGender(clean(rawFields.gender)),
    breed: clean(rawFields.breed),
    color: clean(rawFields.color),
    height_cm: rawHeight,
    country_of_birth: clean(rawFields.country_of_birth),
    studbook: clean(rawFields.studbook),
    passport_number: clean(rawFields.passport_number),
    ueln: clean(rawFields.ueln).replace(/\s+/g, ""),
    microchip: clean(rawFields.microchip).replace(/\s+/g, ""),
    notes: clean(rawFields.notes),
  };

  const pedigree = Array.isArray(parsed.pedigree)
    ? parsed.pedigree.map((item) => {
        const row = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
        return {
          name: clean(row.name),
          sex: normalizeGender(clean(row.sex)) || clean(row.sex),
          breed: clean(row.breed),
          registration_number: clean(row.registration_number),
          relation: clean(row.relation).toLowerCase(),
          sire_name: clean(row.sire_name),
          dam_name: clean(row.dam_name),
        };
      }).filter((item) => item.name || item.sire_name || item.dam_name)
    : [];

  const vaccinations = Array.isArray(parsed.vaccinations)
    ? parsed.vaccinations.map((item) => {
        const row = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
        return {
          vaccine_name: clean(row.vaccine_name),
          administered_date: normalizeAnyDate(row.administered_date),
          next_due_date: normalizeAnyDate(row.next_due_date),
          batch_number: clean(row.batch_number),
          notes: clean(row.notes),
        };
      }).filter((item) => item.vaccine_name || item.administered_date || item.next_due_date || item.batch_number || item.notes)
    : [];

  return {
    page_type: clean(parsed.page_type).toLowerCase(),
    fields,
    pedigree,
    vaccinations,
  };
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "Passport AI is not configured on the server yet." }, { status: 503 });

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No passport image was uploaded." }, { status: 400 });
  if (!allowedTypes.has(file.type)) return NextResponse.json({ error: "Please upload a JPG, PNG or WEBP image." }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "The passport image must be smaller than 10 MB." }, { status: 400 });

  const bytes = Buffer.from(await file.arrayBuffer());
  const imageData = `data:${file.type};base64,${bytes.toString("base64")}`;

  try {
    let normalized = normalizeParsed(await callVision(apiKey, imageData));

    // Dense passport pages can cause the general extraction pass to miss a structured
    // table. If the model classifies the page as pedigree or vaccination but returns
    // no structured rows, run one focused second pass for that table only.
    if (normalized.page_type === "pedigree" && normalized.pedigree.length === 0) {
      normalized = { ...normalized, ...normalizeParsed(await callVision(apiKey, imageData, "pedigree")), page_type: "pedigree" };
    }
    if (normalized.page_type === "vaccination" && normalized.vaccinations.length === 0) {
      normalized = { ...normalized, ...normalizeParsed(await callVision(apiKey, imageData, "vaccination")), page_type: "vaccination" };
    }

    return NextResponse.json(normalized);
  } catch (error) {
    console.error("Horse passport extraction failed", error);
    return NextResponse.json({ error: "The passport could not be read. Please try a clearer photo." }, { status: 502 });
  }
}
