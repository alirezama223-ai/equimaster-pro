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

  const prompt = `You extract structured information from a European horse passport photo. Return ONLY valid JSON with these keys: name, birth_date, gender, breed, color, height_cm, country_of_birth, studbook, passport_number, ueln, microchip, notes. Do not guess. If a value is not clearly visible, use an empty string. birth_date must be copied exactly if visible (for example 27.03.2023). height_cm should be digits only. gender must be one of Mare, Stallion, Gelding, or empty. Distinguish the horse's UELN/life number from the document/certificate number whenever possible. Keep notes short and only include clearly relevant identification details. The user will review everything before saving.`;

  const openAiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.HORSE_PASS_AI_MODEL || "gpt-4.1-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a careful horse-passport data extraction assistant." },
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
