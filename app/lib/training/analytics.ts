import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildLastSevenDayRange,
  defaultSessionTitle,
  firstLineOfText,
  formatActivityDayLabel,
  formatCompletionRate,
  formatSessionDateLabel,
} from "@/app/lib/training/format";
import type {
  TrainingActivityDay,
  TrainingRecentNote,
  TrainingRecentSession,
  TrainingSessionStatus,
  TrainingSummary,
} from "@/app/types/training";

type SessionRow = {
  id: string;
  title: string | null;
  session_date: string;
  status: TrainingSessionStatus;
  duration_minutes: number | null;
  notes: string | null;
};

function mapSessionRow(row: Record<string, unknown>): SessionRow {
  return {
    id: row.id as string,
    title: (row.title as string | null | undefined) ?? null,
    session_date: String(row.session_date),
    status: row.status as TrainingSessionStatus,
    duration_minutes: (row.duration_minutes as number | null | undefined) ?? null,
    notes: (row.notes as string | null | undefined) ?? null,
  };
}

function mapRecentSession(row: SessionRow): TrainingRecentSession {
  const sessionDate = row.session_date;
  return {
    id: row.id,
    title: row.title?.trim() || defaultSessionTitle(sessionDate),
    dateLabel: formatSessionDateLabel(sessionDate),
    status: row.status,
    durationMinutes: row.duration_minutes,
    notesPreview: firstLineOfText(row.notes),
  };
}

export async function fetchTrainingSummary(
  supabase: SupabaseClient,
  userId: string,
  pedigreeHorseId: string
): Promise<{ summary: TrainingSummary; error?: string }> {
  const { data, error } = await supabase
    .from("training_sessions")
    .select("session_date, status")
    .eq("created_by", userId)
    .eq("pedigree_horse_id", pedigreeHorseId);

  if (error) {
    return {
      summary: {
        totalSessions: 0,
        completedSessions: 0,
        completionRateLabel: "0%",
        lastSessionDate: null,
        lastSessionDateLabel: null,
      },
      error: error.message,
    };
  }

  const rows = data ?? [];
  const totalSessions = rows.length;
  const completedSessions = rows.filter((row) => row.status === "completed").length;
  const lastSessionDate =
    rows.length > 0
      ? rows
          .map((row) => String(row.session_date))
          .sort((left, right) => right.localeCompare(left))[0]
      : null;

  return {
    summary: {
      totalSessions,
      completedSessions,
      completionRateLabel: formatCompletionRate(completedSessions, totalSessions),
      lastSessionDate,
      lastSessionDateLabel: lastSessionDate ? formatSessionDateLabel(lastSessionDate) : null,
    },
  };
}

export async function fetchRecentSessions(
  supabase: SupabaseClient,
  userId: string,
  pedigreeHorseId: string,
  limit = 3
): Promise<{ sessions: TrainingRecentSession[]; error?: string }> {
  const { data, error } = await supabase
    .from("training_sessions")
    .select("id, title, session_date, status, duration_minutes, notes")
    .eq("created_by", userId)
    .eq("pedigree_horse_id", pedigreeHorseId)
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { sessions: [], error: error.message };
  }

  return {
    sessions: (data ?? []).map((row) => mapRecentSession(mapSessionRow(row))),
  };
}

export async function fetchTrainingActivity(
  supabase: SupabaseClient,
  userId: string,
  pedigreeHorseId: string
): Promise<{ activity: TrainingActivityDay[]; error?: string }> {
  const dayRange = buildLastSevenDayRange();
  const startDate = dayRange[0];

  const { data, error } = await supabase
    .from("training_sessions")
    .select("session_date")
    .eq("created_by", userId)
    .eq("pedigree_horse_id", pedigreeHorseId)
    .gte("session_date", startDate);

  if (error) {
    return { activity: [], error: error.message };
  }

  const counts = new Map<string, number>();
  for (const day of dayRange) {
    counts.set(day, 0);
  }

  for (const row of data ?? []) {
    const sessionDate = String(row.session_date);
    if (counts.has(sessionDate)) {
      counts.set(sessionDate, (counts.get(sessionDate) ?? 0) + 1);
    }
  }

  const activity = dayRange.map((date) => ({
    date,
    dateLabel: formatActivityDayLabel(date),
    sessionCount: counts.get(date) ?? 0,
  }));

  return { activity };
}

export async function fetchRecentSessionNotes(
  supabase: SupabaseClient,
  userId: string,
  pedigreeHorseId: string,
  limit = 5
): Promise<{ notes: TrainingRecentNote[]; error?: string }> {
  const { data, error } = await supabase
    .from("training_sessions")
    .select("id, title, session_date, notes")
    .eq("created_by", userId)
    .eq("pedigree_horse_id", pedigreeHorseId)
    .not("notes", "is", null)
    .neq("notes", "")
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { notes: [], error: error.message };
  }

  const notes = (data ?? [])
    .map((row) => {
      const sessionDate = String(row.session_date);
      const notesPreview = firstLineOfText(row.notes as string | null | undefined);
      if (!notesPreview) {
        return null;
      }

      return {
        id: row.id as string,
        sessionDate,
        dateLabel: formatSessionDateLabel(sessionDate),
        title: ((row.title as string | null | undefined)?.trim() || defaultSessionTitle(sessionDate)),
        notesPreview,
      };
    })
    .filter((entry): entry is TrainingRecentNote => entry !== null);

  return { notes };
}
