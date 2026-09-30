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

  const prompt = `Read this horse passport page carefully and extract EVERY clearly visible horse identification/detail that belongs in the requested fields. Do not focus only on the passport/document number.

This can be any page of a European horse passport, including German-language pages. The photo may show only some of the fields. Read headings and values in German, English, Dutch, French or other European languages and map them to the closest requested field.

Return ONLY valid JSON with exactly these keys: name, birth_date, gender, breed, color, height_cm, country_of_birth, studbook, passport_number, ueln, microchip, notes.

Important rules:
- Extract all visible fields from THIS image, not just one number.
- Do not guess or invent anything.
- If a requested field is not visible or cannot be read reliably on this page, return an empty string for that field.
- A blank result means "not found on this page"; it must not be treated as evidence that another page has no value.
- name: horse's registered/name field.
- birth_date: horse's date of birth; copy it if visible.
- gender: use only Mare, Stallion, Gelding, or empty. German terms include Stute, Hengst and Wallach.
- breed: breed/type/studbook breed if clearly shown.
- color: horse colour, including German terms such as Fuchs, Braun, Rappe, Schimmel, etc.
- height_cm: only the horse's height in centimetres; digits only. Do not use a page number or other measurement.
- country_of_birth: country/place of birth if clearly shown.
- studbook: studbook/registry/association if shown.
- passport_number: the document/passport/certificate number, not the UELN unless they are explicitly the same.
- ueln: the horse's UELN/life number/transponder life number when clearly labelled.
- microchip: the transponder/microchip number when clearly labelled.
- notes: include other clearly relevant horse-identification information visible on this page that does not fit the fields above. If this is a vaccination or medical page, summarize the clearly readable vaccination/medical entries here rather than ignoring them.

Pay particular attention to printed tables, labels and values. The user will review all extracted information before saving.`;

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
        { role: "system", content: "You are a meticulous European horse-passport document extraction assistant. Extract all visible information rather than selecting only the easiest number." },
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

  const rawDate = clean(parsed.birth_date);
  const rawHeight = clean(parsed.height_cm).replace(/[^0-9]/g, "");
  const fields = {
    name: clean(parsed.name),
    birth_date: normalizeDate(rawDate) || (rawDate.match(/^\d{4}-\d{2}-\d{2}$/) ? rawDate : ""),
    gender: normalizeGender(clean(parsed.gender)),
    breed: clean(parsed.breed),
    color: clean(parsed.color),
    height_cm: rawHeight,
    country_of_birth: clean(parsed.country_of_birth),
    studbook: clean(parsed.studbook),
    passport_number: clean(parsed.passport_number),
    ueln: clean(parsed.ueln).replace(/\s+/g, ""),
    microchip: clean(parsed.microchip).replace(/\s+/g, ""),
    notes: clean(parsed.notes),
  };

  return NextResponse.json({ fields });
}
