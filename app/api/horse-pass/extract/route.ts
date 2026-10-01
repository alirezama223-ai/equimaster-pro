import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_BYTES = 40 * 1024 * 1024;
const MAX_FILES = 10;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const extractionSchema = {
  name: "horse_passport",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      name: { type: ["string", "null"] },
      birth_date: { type: ["string", "null"] },
      sex: { type: ["string", "null"] },
      breed: { type: ["string", "null"] },
      color: { type: ["string", "null"] },
      country: { type: ["string", "null"] },
      height_cm: { type: ["number", "null"] },
      sire: { type: ["string", "null"] },
      dam: { type: ["string", "null"] },
      dam_sire: { type: ["string", "null"] },
      registration_number: { type: ["string", "null"] },
      ueln: { type: ["string", "null"] },
      microchip: { type: ["string", "null"] },
      breeder: { type: ["string", "null"] },
      issuing_organization: { type: ["string", "null"] },
      vaccinations: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            vaccine_name: { type: ["string", "null"] },
            administered_date: { type: ["string", "null"] },
            next_due_date: { type: ["string", "null"] },
            batch_number: { type: ["string", "null"] },
            notes: { type: ["string", "null"] },
          },
          required: ["vaccine_name", "administered_date", "next_due_date", "batch_number", "notes"],
        },
      },
      confidence: { type: ["number", "null"] },
    },
    required: [
      "name",
      "birth_date",
      "sex",
      "breed",
      "color",
      "country",
      "height_cm",
      "sire",
      "dam",
      "dam_sire",
      "registration_number",
      "ueln",
      "microchip",
      "breeder",
      "issuing_organization",
      "vaccinations",
      "confidence",
    ],
  },
};

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Please sign in before scanning a horse passport." }, { status: 401 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Horse passport AI scanning is not configured on this deployment." }, { status: 503 });
  }

  const formData = await request.formData();
  const files = formData.getAll("file").filter((value): value is File => value instanceof File);

  if (files.length === 0) return NextResponse.json({ error: "Please upload at least one passport image." }, { status: 400 });
  if (files.length > MAX_FILES) return NextResponse.json({ error: `Please upload no more than ${MAX_FILES} passport images at once.` }, { status: 400 });

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  if (totalBytes > MAX_TOTAL_BYTES) return NextResponse.json({ error: "The combined image size is too large. Maximum is 40 MB." }, { status: 413 });

  for (const file of files) {
    if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: "Unsupported image type. Use JPG, PNG or WEBP." }, { status: 400 });
    if (file.size > MAX_FILE_BYTES) return NextResponse.json({ error: "One of the images is too large. Maximum size per image is 10 MB." }, { status: 413 });
  }

  const images = await Promise.all(files.map(async (file) => {
    const bytes = Buffer.from(await file.arrayBuffer());
    return `data:${file.type};base64,${bytes.toString("base64")}`;
  }));

  const model = process.env.HORSE_PASS_AI_MODEL || "gpt-4.1-mini";

  const prompt = `You extract structured data from photos of a European horse passport. Read only what is visibly present across all uploaded images. Combine the pages when they belong to the same passport. Do not guess, invent, or copy placeholder values from the website. If a field is not visible on any uploaded page, return null.

Pay special attention to the horse's name: it may be printed or handwritten in the field labeled Name/Name/Nom. If a clearly readable name is visible there on any page, return it exactly as written. Do not confuse the breeder, owner, or sire/dam names with the horse name.

Preserve names, registration numbers, UELN and microchip identifiers exactly as printed where possible. Normalize birth_date to YYYY-MM-DD only when the full date is visible. For sex, return one of Mare, Stallion, Gelding when the passport clearly supports it; otherwise null. Return country as the English country name when it is clearly identifiable. height_cm should only be returned when an explicit height in centimeters is visible; never infer it.

MOST IMPORTANT: inspect every uploaded page for the vaccination/immunisation history. German labels can include Impfungen, Impfung, Impfstoff, Impfdatum, nächste Impfung, Chargennummer, Krankheit(en), Tierarzt, and English labels can include Vaccination, Vaccine, Date, Batch number, Disease. Read EVERY visible vaccination row separately, including handwritten rows, stickers, stamps and rows where only a date or batch number is readable. Do not skip a row because one field is unclear. For each row return vaccine_name, administered_date, next_due_date, batch_number and notes. Put the disease name in notes when it is visible. If the vaccine name is not readable, return null for vaccine_name but preserve the date/batch/veterinarian information in the row. Dates should be YYYY-MM-DD only when the full date is clear. Never confuse passport page numbers, birth dates, UELN or microchip numbers with vaccination dates.

The vaccination table is often on a separate page from the identity and pedigree pages. A page may contain several vaccination rows, so inspect the whole image rather than stopping after the first match. The result will be shown to a human for verification before saving.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_schema", json_schema: extractionSchema },
      messages: [
        { role: "system", content: prompt },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract the horse passport identity, pedigree clues and EVERY vaccination record from all of these images." },
            ...images.map((url) => ({ type: "image_url" as const, image_url: { url, detail: "high" as const } })),
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    console.error("Horse passport AI request failed", response.status, details.slice(0, 1000));
    return NextResponse.json({ error: "The passport could not be analyzed right now. Please try again." }, { status: 502 });
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  const data = typeof content === "string" ? safeJsonParse(content) : null;
  if (!data || typeof data !== "object") return NextResponse.json({ error: "The AI returned an invalid extraction result." }, { status: 502 });

  return NextResponse.json({ data });
}
