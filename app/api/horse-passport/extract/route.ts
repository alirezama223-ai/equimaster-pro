import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeDate(value: string) {
  const match = value.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (!match) return "";
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function normalizeAnyDate(value: unknown) {
  const raw = clean(value);
  return normalizeDate(raw) || (raw.match(/^\d{4}-\d{2}-\d{2}$/) ? raw : "");
}

function normalizeGender(value: string) {
  const v = value.toLowerCase();
  if (v.includes("mare") || v.includes("stute") || v.includes("weib")) return "Mare";
  if (v.includes("stallion") || v.includes("hengst")) return "Stallion";
  if (v.includes("gelding") || v.includes("wallach")) return "Gelding";
  return "";
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

  const prompt = `You are extracting structured data from ONE photographed page of a European horse passport. Be exhaustive and methodical.

First inspect the entire image at high detail. Read the page from top to bottom and left to right. Pay special attention to the horse identity/name printed in the page header, identity table, signalment/description section, registration section, and any repeated horse-name field. Also inspect small printed labels and values, not just large numbers.

Then perform a field-by-field checklist for EVERY requested field before producing the JSON. Do not stop after finding the passport number. If a value is visible anywhere on this page, extract it even if it appears in an unexpected location. If the same value appears more than once, use the clearest occurrence.

This can be any page of a European horse passport, including German-language pages. Read headings and values in German, English, Dutch, French or other European languages and map them to the closest requested field.

Return ONLY valid JSON with exactly these top-level keys: fields, pedigree, vaccinations.

fields must contain exactly: name, birth_date, gender, breed, color, height_cm, country_of_birth, studbook, passport_number, ueln, microchip, notes.
pedigree must be an array of zero or more objects. Each object must contain exactly: name, sex, breed, registration_number, relation, sire_name, dam_name. relation must be one of: self, sire, dam, paternal_grandsire, paternal_granddam, maternal_grandsire, maternal_granddam, other. Include every clearly readable ancestor on pedigree/genealogy pages. Use the horse's registered name, not a shortened nickname.
vaccinations must be an array of zero or more objects. Each object must contain exactly: vaccine_name, administered_date, next_due_date, batch_number, notes. Include every clearly readable vaccination/medical prophylaxis entry on vaccination pages. Do not invent missing dates or vaccine names.

Important rules:
- Extract all clearly visible information from THIS image, not only the easiest number.
- Do not guess or invent anything.
- If a requested field is genuinely not visible or cannot be read reliably on this page, return an empty string for that field.
- An empty result means only "not found on this page"; it must never mean that another passport page has no value.
- name: registered horse name. Look especially for a prominent name/header near the beginning of the passport, and for labels such as Name, Name des Pferdes, Nom, Naam, Horse name, or equivalent.
- birth_date: horse's date of birth; copy it if visible. Do not confuse it with issue dates, vaccination dates, or page dates.
- gender: use only Mare, Stallion, Gelding, or empty. German terms include Stute, Hengst and Wallach. Look for sex/gender fields and signalment sections.
- breed: breed/type/studbook breed if clearly shown. Do not confuse the breed with the issuing association.
- color: horse colour, including German terms such as Fuchs, Braun, Rappe, Schimmel, etc.
- height_cm: only the horse's height in centimetres; digits only. Look for Stockmaß, Größe, height, withers height or equivalent. Do not use a page number, date, weight, microchip, UELN or other measurement.
- country_of_birth: country/place of birth if clearly shown. Normalize obvious country names such as Deutschland/Germany to a readable country name.
- studbook: studbook/registry/association if shown, such as Bayerischer Zuchtverband or Bayerisches Zuchtbuch. Keep the actual registry/association text; do not put it in breed unless it is explicitly the breed.
- passport_number: the document/passport/certificate number, not the UELN unless they are explicitly the same.
- ueln: the horse's UELN/life number when clearly labelled. Keep the full number and remove spaces only.
- microchip: the transponder/microchip number when clearly labelled. Do not copy the UELN into this field unless the document explicitly labels the same number as the microchip/transponder.
- notes: include other clearly relevant horse-identification information visible on this page that does not fit the fields above.
- For pedigree pages, capture ancestors and their sire/dam relationships whenever the page makes them clear. Preserve spelling exactly as printed.
- For vaccination pages, capture every visible row/entry separately. German labels may include Impfungen, Impfung, Impfdatum, nächste Impfung, Chargennummer, Tierarzt and Impfstoff.

Before returning JSON, internally verify the fields, pedigree array and vaccinations array against the image one more time. In particular, actively check small tables and handwritten/printed entries.`;

  const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.HORSE_PASS_AI_MODEL || "gpt-4.1",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a meticulous European horse-passport document extraction assistant. You must inspect the whole image and complete a field-by-field checklist before returning JSON. Never select only one easy number when other fields are visible." },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageData, detail: "high" } },
          ],
        },
      ],
    }),
  });

  if (!openAiResponse.ok) {
    const details = await openAiResponse.text();
    console.error("Horse passport extraction failed", details);
    return NextResponse.json({ error: "The passport could not be read. Please try a clearer photo." }, { status: 502 });
  }

  const payload = await openAiResponse.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string") return NextResponse.json({ error: "The passport reader returned no data." }, { status: 502 });

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content);
  } catch {
    return NextResponse.json({ error: "The passport reader returned invalid data. Please try again." }, { status: 502 });
  }

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
          relation: clean(row.relation),
          sire_name: clean(row.sire_name),
          dam_name: clean(row.dam_name),
        };
      }).filter((item) => item.name)
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
      }).filter((item) => item.vaccine_name || item.administered_date || item.batch_number || item.notes)
    : [];

  return NextResponse.json({ fields, pedigree, vaccinations });
}
