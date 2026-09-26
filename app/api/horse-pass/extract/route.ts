import { NextResponse } from "next/server";
import { createClient } from "@/app/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 10 * 1024 * 1024;
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Please sign in before scanning a horse passport." },
      { status: 401 }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Horse passport AI scanning is not configured on this deployment." },
      { status: 503 }
    );
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Please upload a passport image." }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Unsupported image type. Use JPG, PNG or WEBP." },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: "The image is too large. Maximum size is 10 MB." },
      { status: 413 }
    );
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const image = `data:${file.type};base64,${bytes.toString("base64")}`;
  const model = process.env.HORSE_PASS_AI_MODEL || "gpt-4.1-mini";

  const prompt = `You extract structured data from European horse passports. Read only what is visibly present in the uploaded image. Do not guess or invent missing values. Preserve names, registration numbers, UELN and microchip identifiers exactly as printed where possible. Normalize birth_date to YYYY-MM-DD only when the full date is visible. For sex, return one of Mare, Stallion, Gelding when the passport clearly supports it; otherwise null. Return country as the English country name when it is clearly identifiable. height_cm should only be returned when an explicit height in centimeters is visible. confidence is an overall 0-1 estimate of extraction quality, not a claim that the document is authentic. The result will be shown to a human for verification before saving.`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_schema", json_schema: extractionSchema },
      messages: [
        { role: "system", content: prompt },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract the horse passport fields from this image." },
            { type: "image_url", image_url: { url: image, detail: "high" } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    console.error("Horse passport AI request failed", response.status, details.slice(0, 1000));
    return NextResponse.json(
      { error: "The passport could not be analyzed right now. Please try again." },
      { status: 502 }
    );
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  const data = typeof content === "string" ? safeJsonParse(content) : null;

  if (!data || typeof data !== "object") {
    return NextResponse.json(
      { error: "The AI returned an invalid extraction result." },
      { status: 502 }
    );
  }

  return NextResponse.json({ data });
}
