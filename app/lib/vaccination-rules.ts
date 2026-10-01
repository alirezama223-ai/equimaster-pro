export type VaccinationHistoryRow = {
  id?: string;
  vaccine_name?: string | null;
  administered_date?: string | null;
  next_due_date?: string | null;
};

export type VaccinationSchedule = {
  ruleKey: string;
  label: string;
  nextDueDate: string;
  reason: string;
  confidence: "high" | "medium";
  autoReminder: boolean;
};

function normalize(value: string | null | undefined) {
  return String(value ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function dateOnly(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function addDays(dateText: string, days: number) {
  const date = new Date(`${dateText}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function addMonths(dateText: string, months: number) {
  const date = new Date(`${dateText}T12:00:00Z`);
  const day = date.getUTCDate();
  date.setUTCDate(1);
  date.setUTCMonth(date.getUTCMonth() + months);
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(day, lastDay));
  return date.toISOString().slice(0, 10);
}

function daysBetween(older: string, newer: string) {
  const a = Date.parse(`${older}T12:00:00Z`);
  const b = Date.parse(`${newer}T12:00:00Z`);
  return Math.round((b - a) / 86400000);
}

function vaccineKind(vaccineName: string, notes?: string | null) {
  const text = `${normalize(vaccineName)} ${normalize(notes)}`;
  if (/influenza|equine flu|proteqflu|prequenza|flu\b/.test(text)) return "influenza";
  if (/tetanus|equilis\s*te\b|tetanus\s*toxoid/.test(text)) return "tetanus";
  if (/herpes|ehv[-\s]?1|rhinopneumonitis|rhinopneumonie/.test(text)) return "herpes";
  return "unknown";
}

export function analyzeVaccinationSchedule(input: {
  vaccineName: string;
  notes?: string | null;
  administeredDate: string;
  history: VaccinationHistoryRow[];
}): VaccinationSchedule | null {
  const administeredDate = dateOnly(input.administeredDate);
  if (!administeredDate) return null;

  const kind = vaccineKind(input.vaccineName, input.notes);
  const history = input.history
    .filter((row) => dateOnly(String(row.administered_date ?? "")))
    .filter((row) => dateOnly(String(row.administered_date))! <= administeredDate)
    .sort((a, b) => String(b.administered_date).localeCompare(String(a.administered_date)));

  if (kind === "tetanus") {
    return {
      ruleKey: "tetanus_booster_2y_conservative",
      label: "Tetanus · 2 years",
      nextDueDate: addMonths(administeredDate, 24),
      reason: "German equine vaccination guidance gives tetanus boosters at 2–3 year intervals depending on the vaccine; EquiMaster uses the conservative 2-year reminder unless the passport already specifies another due date.",
      confidence: "high",
      autoReminder: true,
    };
  }

  if (kind === "herpes") {
    return {
      ruleKey: "herpes_booster_6m",
      label: "Herpes/EHV · 6 months",
      nextDueDate: addMonths(administeredDate, 6),
      reason: "FN guidance based on StIKo Vet recommends herpes boosters every 6 months after the primary course.",
      confidence: "high",
      autoReminder: true,
    };
  }

  if (kind === "influenza") {
    const previous = history.find((row) => row.administered_date !== administeredDate && vaccineKind(String(row.vaccine_name ?? ""), "") === "influenza");
    const gap = previous?.administered_date ? daysBetween(String(previous.administered_date), administeredDate) : null;

    if (!previous || (gap !== null && gap > 202)) {
      return {
        ruleKey: "influenza_primary_v2",
        label: "Influenza · V2 in 4–6 weeks",
        nextDueDate: addDays(administeredDate, 42),
        reason: "FN national competition rules require the second primary influenza vaccination 28–70 days after V1. EquiMaster uses the middle of that window for the reminder when no reliable primary-course history is available.",
        confidence: previous ? "medium" : "high",
        autoReminder: true,
      };
    }

    if (gap !== null && gap >= 28 && gap <= 70) {
      return {
        ruleKey: "influenza_primary_v3_or_booster_6m21d",
        label: "Influenza · within 6 months + 21 days",
        nextDueDate: addDays(addMonths(administeredDate, 6), 21),
        reason: "FN LPO rules require the third primary vaccination and subsequent competition boosters no later than 6 months + 21 days after the relevant vaccination.",
        confidence: "high",
        autoReminder: true,
      };
    }

    return {
      ruleKey: "influenza_booster_6m21d",
      label: "Influenza · within 6 months + 21 days",
      nextDueDate: addDays(addMonths(administeredDate, 6), 21),
      reason: "FN LPO competition rules require influenza boosters at intervals of no more than 6 months + 21 days. For general health, StIKo Vet also recommends 6-month boosters, with up to 12 months possible in low-exposure horses.",
      confidence: "high",
      autoReminder: true,
    };
  }

  return null;
}
