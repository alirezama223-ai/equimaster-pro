import type { HorseTrainingAnalytics } from "@/app/types/training-analytics";

export type TrainingAiCoachResult = {
  headline: string;
  assessment: string;
  priorities: string[];
  nextSession: string[];
  caution: string | null;
};

function extractOutputText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const record = payload as { output_text?: unknown; output?: unknown };
  if (typeof record.output_text === "string") return record.output_text;

  const output = Array.isArray(record.output) ? record.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as { content?: unknown }).content;
    if (!Array.isArray(content)) continue;
    for (const part of content) {
      if (part && typeof part === "object" && typeof (part as { text?: unknown }).text === "string") {
        return (part as { text: string }).text;
      }
    }
  }
  return "";
}

function parseCoachResult(text: string): TrainingAiCoachResult {
  const cleaned = text.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
  const parsed = JSON.parse(cleaned) as Partial<TrainingAiCoachResult>;

  if (
    typeof parsed.headline !== "string" ||
    typeof parsed.assessment !== "string" ||
    !Array.isArray(parsed.priorities) ||
    !Array.isArray(parsed.nextSession)
  ) {
    throw new Error("AI coach returned an invalid response.");
  }

  return {
    headline: parsed.headline,
    assessment: parsed.assessment,
    priorities: parsed.priorities.filter((value): value is string => typeof value === "string").slice(0, 4),
    nextSession: parsed.nextSession.filter((value): value is string => typeof value === "string").slice(0, 4),
    caution: typeof parsed.caution === "string" ? parsed.caution : null,
  };
}

export async function generateTrainingAiCoach(
  analytics: HorseTrainingAnalytics
): Promise<TrainingAiCoachResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Training AI is not configured yet. Add OPENAI_API_KEY to the server environment.");
  }

  const model = process.env.OPENAI_TRAINING_MODEL ?? "gpt-5.6-luna";
  const input = {
    horse: analytics.summary.horseName,
    summary: analytics.summary,
    ratings: analytics.ratingsOverTime.slice(-12),
    trainingLoad: analytics.trainingLoad.slice(-30),
    exerciseFrequency: analytics.exerciseFrequency.slice(0, 12),
    coachNotes: analytics.coachNotes.slice(0, 12),
    horseFeelingDistribution: analytics.horseFeelingDistribution,
    ruleEvaluation: analytics.ruleEvaluation,
  };

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content:
            "You are EquiMaster Pro's professional horse-training AI coach. Analyze only the supplied training data. Do not diagnose medical conditions. Respect health alerts and recommend veterinary evaluation when the data indicates a health concern. Give concise, practical, horse-specific coaching advice. Return ONLY valid JSON with keys: headline (string), assessment (string), priorities (string[] max 4), nextSession (string[] max 4), caution (string|null).",
        },
        {
          role: "user",
          content: JSON.stringify(input),
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "training_ai_coach",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              headline: { type: "string" },
              assessment: { type: "string" },
              priorities: { type: "array", items: { type: "string" }, maxItems: 4 },
              nextSession: { type: "array", items: { type: "string" }, maxItems: 4 },
              caution: { type: ["string", "null"] },
            },
            required: ["headline", "assessment", "priorities", "nextSession", "caution"],
          },
        },
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Training AI request failed (${response.status}): ${message.slice(0, 300)}`);
  }

  const payload = await response.json();
  return parseCoachResult(extractOutputText(payload));
}
