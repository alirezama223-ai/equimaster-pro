import type { SupabaseClient } from "@supabase/supabase-js";
import {
  firstLineOfText,
  formatCalendarMonthLabel,
  formatSessionDateLabel,
  toCalendarIndicatorStatus,
  toDateOnlyString,
} from "@/app/lib/training/format";
import type {
  TrainingCalendarDay,
  TrainingCalendarMonth,
  TrainingCalendarSession,
  TrainingSessionStatus,
} from "@/app/types/training";

export const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonthDateRange(year: number, month: number): { start: string; end: string } {
  const start = toDateOnlyString(new Date(year, month, 1));
  const end = toDateOnlyString(new Date(year, month + 1, 0));
  return { start, end };
}

function buildCalendarGrid(
  year: number,
  month: number,
  sessionsByDate: Map<string, TrainingCalendarSession>,
  horseName: string,
  referenceDate: Date = new Date()
): TrainingCalendarMonth {
  const today = toDateOnlyString(referenceDate);
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - startOffset);

  const days: TrainingCalendarDay[] = [];

  for (let index = 0; index < 42; index += 1) {
    const cellDate = new Date(gridStart);
    cellDate.setDate(gridStart.getDate() + index);
    const date = toDateOnlyString(cellDate);
    const session = sessionsByDate.get(date) ?? null;

    days.push({
      date,
      dayNumber: cellDate.getDate(),
      isCurrentMonth: cellDate.getMonth() === month,
      isToday: date === today,
      indicatorStatus: toCalendarIndicatorStatus(session?.status),
      session,
    });
  }

  return {
    monthLabel: formatCalendarMonthLabel(year, month),
    year,
    month,
    horseName,
    days,
  };
}

function mapSessionRow(
  row: Record<string, unknown>,
  horseName: string
): TrainingCalendarSession {
  const sessionDate = String(row.session_date);
  return {
    id: row.id as string,
    sessionDate,
    dateLabel: formatSessionDateLabel(sessionDate),
    status: row.status as TrainingSessionStatus,
    horseName,
    notesPreview: firstLineOfText(row.notes as string | null | undefined),
  };
}

export function createEmptyTrainingCalendarMonth(
  horseName = "",
  referenceDate: Date = new Date()
): TrainingCalendarMonth {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  return buildCalendarGrid(year, month, new Map(), horseName, referenceDate);
}

export async function fetchTrainingCalendarMonth(
  supabase: SupabaseClient,
  userId: string,
  pedigreeHorseId: string,
  referenceDate: Date = new Date()
): Promise<{ calendar: TrainingCalendarMonth; error?: string }> {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const { start, end } = getMonthDateRange(year, month);

  const [{ data: horseRow, error: horseError }, { data: sessionRows, error: sessionError }] =
    await Promise.all([
      supabase.from("pedigree_horses").select("name").eq("id", pedigreeHorseId).maybeSingle(),
      supabase
        .from("training_sessions")
        .select("id, session_date, status, notes, created_at")
        .eq("created_by", userId)
        .eq("pedigree_horse_id", pedigreeHorseId)
        .gte("session_date", start)
        .lte("session_date", end)
        .order("session_date", { ascending: true })
        .order("created_at", { ascending: false }),
    ]);

  if (horseError) {
    return { calendar: createEmptyTrainingCalendarMonth("", referenceDate), error: horseError.message };
  }

  if (sessionError) {
    return {
      calendar: createEmptyTrainingCalendarMonth(horseRow?.name as string | undefined ?? "", referenceDate),
      error: sessionError.message,
    };
  }

  const horseName = ((horseRow?.name as string | undefined) ?? "").trim() || "Unknown horse";
  const sessionsByDate = new Map<string, TrainingCalendarSession>();

  for (const row of sessionRows ?? []) {
    const sessionDate = String(row.session_date);
    if (!sessionsByDate.has(sessionDate)) {
      sessionsByDate.set(sessionDate, mapSessionRow(row, horseName));
    }
  }

  return {
    calendar: buildCalendarGrid(year, month, sessionsByDate, horseName, referenceDate),
  };
}
