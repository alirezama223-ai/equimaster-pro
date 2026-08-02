import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildLastThirtyDayRange,
  defaultSessionTitle,
  formatActivityDayLabel,
  formatCompletionRate,
  formatSessionDateLabel,
} from "@/app/lib/training/format";
import type {
  CoachNoteEntry,
  ExerciseFrequencyItem,
  HorseFeelingDistribution,
  HorseTrainingAnalytics,
  HorseTrainingAnalyticsErrors,
  HorseTrainingSummary,
  RatingTrendPoint,
  TrainingLoadDay,
} from "@/app/types/training-analytics";
import { buildRuleEvaluationContext, evaluateHorseTrainingRules, mergeRuleEvaluationWithHealth } from "@/app/lib/training/rules";
import { getRuleEngineProvider } from "@/app/lib/training/rules/registry";
import { fetchHorseHealthSnapshot } from "@/app/lib/health/horse-health";
import { evaluateHealthRules } from "@/app/lib/health/rules";
import { syncHorseEventsFromAnalytics } from "@/app/lib/events/sync-horse-events";

const EMPTY_SUMMARY: HorseTrainingSummary = {
  pedigreeHorseId: "",
  horseName: "Unknown horse",
  totalSessions: 0,
  completedSessions: 0,
  completionRate: 0,
  completionRateLabel: "0%",
  averageRating: null,
  averageDurationMinutes: null,
  currentTrainingStreak: 0,
  lastSessionDate: null,
  lastSessionDateLabel: null,
  lastSessionId: null,
};

type SummaryRow = {
  pedigree_horse_id: string;
  horse_name: string;
  total_sessions: number;
  completed_sessions: number;
  completion_rate: number | null;
  average_rating: number | null;
  average_duration_minutes: number | null;
  current_training_streak: number;
  last_session_date: string | null;
  last_session_id: string | null;
};

function mapSummaryRow(row: SummaryRow, pedigreeHorseId: string, horseNameFallback: string): HorseTrainingSummary {
  const totalSessions = row.total_sessions ?? 0;
  const completedSessions = row.completed_sessions ?? 0;
  const lastSessionDate = row.last_session_date ? String(row.last_session_date) : null;

  return {
    pedigreeHorseId: row.pedigree_horse_id ?? pedigreeHorseId,
    horseName: row.horse_name?.trim() || horseNameFallback,
    totalSessions,
    completedSessions,
    completionRate: row.completion_rate ?? 0,
    completionRateLabel: formatCompletionRate(completedSessions, totalSessions),
    averageRating: row.average_rating ?? null,
    averageDurationMinutes: row.average_duration_minutes ?? null,
    currentTrainingStreak: row.current_training_streak ?? 0,
    lastSessionDate,
    lastSessionDateLabel: lastSessionDate ? formatSessionDateLabel(lastSessionDate) : null,
    lastSessionId: (row.last_session_id as string | null | undefined) ?? null,
  };
}

function buildEmptyAnalytics(pedigreeHorseId: string, horseName: string): HorseTrainingAnalytics {
  const summary = { ...EMPTY_SUMMARY, pedigreeHorseId, horseName };
  return {
    summary,
    ratingsOverTime: [],
    trainingLoad: buildLastThirtyDayRange().map((date) => ({
      date,
      dateLabel: formatActivityDayLabel(date),
      sessionCount: 0,
      totalDurationMinutes: 0,
    })),
    exerciseFrequency: [],
    coachNotes: [],
    horseFeelingDistribution: [],
    ruleEvaluation: evaluateHorseTrainingRules({
      summary,
      ratingsOverTime: [],
      trainingLoad: buildLastThirtyDayRange().map((date) => ({
        date,
        dateLabel: formatActivityDayLabel(date),
        sessionCount: 0,
        totalDurationMinutes: 0,
      })),
      exerciseFrequency: [],
      coachNotes: [],
      horseFeelingDistribution: [],
    }),
  };
}

export async function fetchHorseTrainingSummaryFromView(
  supabase: SupabaseClient,
  userId: string,
  pedigreeHorseId: string,
  horseNameFallback: string
): Promise<{ summary: HorseTrainingSummary; error?: string }> {
  const { data, error } = await supabase
    .from("horse_training_summary")
    .select(
      "pedigree_horse_id, horse_name, total_sessions, completed_sessions, completion_rate, average_rating, average_duration_minutes, current_training_streak, last_session_date, last_session_id"
    )
    .eq("created_by", userId)
    .eq("pedigree_horse_id", pedigreeHorseId)
    .maybeSingle();

  if (error) {
    if (error.message.includes("horse_training_summary") || error.message.includes("does not exist")) {
      return {
        summary: { ...EMPTY_SUMMARY, pedigreeHorseId, horseName: horseNameFallback },
        error: "Analytics view is not available yet. Run migration 025 in Supabase.",
      };
    }

    return {
      summary: { ...EMPTY_SUMMARY, pedigreeHorseId, horseName: horseNameFallback },
      error: error.message,
    };
  }

  if (!data) {
    return {
      summary: { ...EMPTY_SUMMARY, pedigreeHorseId, horseName: horseNameFallback },
    };
  }

  return {
    summary: mapSummaryRow(data as SummaryRow, pedigreeHorseId, horseNameFallback),
  };
}

export async function fetchRatingsOverTime(
  supabase: SupabaseClient,
  userId: string,
  pedigreeHorseId: string,
  limit = 12
): Promise<{ ratings: RatingTrendPoint[]; error?: string }> {
  const { data, error } = await supabase
    .from("training_sessions")
    .select("id, session_date, rider_rating")
    .eq("created_by", userId)
    .eq("pedigree_horse_id", pedigreeHorseId)
    .eq("status", "completed")
    .not("rider_rating", "is", null)
    .order("session_date", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    if (error.message.includes("rider_rating")) {
      return { ratings: [] };
    }
    return { ratings: [], error: error.message };
  }

  return {
    ratings: (data ?? []).map((row) => {
      const sessionDate = String(row.session_date);
      return {
        sessionId: row.id as string,
        sessionDate,
        dateLabel: formatSessionDateLabel(sessionDate),
        rating: row.rider_rating as number,
      };
    }),
  };
}

export async function fetchTrainingLoadLast30Days(
  supabase: SupabaseClient,
  userId: string,
  pedigreeHorseId: string
): Promise<{ load: TrainingLoadDay[]; error?: string }> {
  const dayRange = buildLastThirtyDayRange();
  const startDate = dayRange[0];

  const { data, error } = await supabase
    .from("training_sessions")
    .select("session_date, duration_minutes, status")
    .eq("created_by", userId)
    .eq("pedigree_horse_id", pedigreeHorseId)
    .eq("status", "completed")
    .gte("session_date", startDate);

  if (error) {
    return { load: [], error: error.message };
  }

  const counts = new Map<string, { sessionCount: number; totalDurationMinutes: number }>();
  for (const date of dayRange) {
    counts.set(date, { sessionCount: 0, totalDurationMinutes: 0 });
  }

  for (const row of data ?? []) {
    const sessionDate = String(row.session_date);
    const bucket = counts.get(sessionDate);
    if (!bucket) continue;

    bucket.sessionCount += 1;
    bucket.totalDurationMinutes += (row.duration_minutes as number | null | undefined) ?? 0;
  }

  return {
    load: dayRange.map((date) => {
      const bucket = counts.get(date) ?? { sessionCount: 0, totalDurationMinutes: 0 };
      return {
        date,
        dateLabel: formatActivityDayLabel(date),
        sessionCount: bucket.sessionCount,
        totalDurationMinutes: bucket.totalDurationMinutes,
      };
    }),
  };
}

export async function fetchExerciseFrequency(
  supabase: SupabaseClient,
  userId: string,
  pedigreeHorseId: string,
  limit = 8
): Promise<{ exercises: ExerciseFrequencyItem[]; error?: string }> {
  const { data: sessions, error: sessionsError } = await supabase
    .from("training_sessions")
    .select("id")
    .eq("created_by", userId)
    .eq("pedigree_horse_id", pedigreeHorseId);

  if (sessionsError) {
    return { exercises: [], error: sessionsError.message };
  }

  const sessionIds = (sessions ?? []).map((row) => row.id as string);
  if (sessionIds.length === 0) {
    return { exercises: [] };
  }

  const { data, error } = await supabase
    .from("training_session_exercises")
    .select("exercise_id, exercises(name, category)")
    .in("training_session_id", sessionIds);

  if (error) {
    return { exercises: [], error: error.message };
  }

  const frequency = new Map<string, ExerciseFrequencyItem>();
  for (const row of data ?? []) {
    const exerciseId = row.exercise_id as string;
    const exercise = row.exercises as { name?: string; category?: string } | null;
    const existing = frequency.get(exerciseId);

    if (existing) {
      existing.count += 1;
      continue;
    }

    frequency.set(exerciseId, {
      exerciseId,
      label: exercise?.name?.trim() || "Untitled exercise",
      category: exercise?.category?.trim() || null,
      count: 1,
    });
  }

  const exercises = [...frequency.values()]
    .sort((left, right) => right.count - left.count)
    .slice(0, limit);

  return { exercises };
}

export async function fetchRecentCoachNotes(
  supabase: SupabaseClient,
  userId: string,
  pedigreeHorseId: string,
  limit = 5
): Promise<{ notes: CoachNoteEntry[]; error?: string }> {
  const { data, error } = await supabase
    .from("training_sessions")
    .select("id, title, session_date, coach_notes")
    .eq("created_by", userId)
    .eq("pedigree_horse_id", pedigreeHorseId)
    .not("coach_notes", "is", null)
    .neq("coach_notes", "")
    .order("session_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    if (error.message.includes("coach_notes")) {
      return { notes: [] };
    }
    return { notes: [], error: error.message };
  }

  const notes = (data ?? [])
    .map((row) => {
      const coachNotes = (row.coach_notes as string | null | undefined)?.trim();
      if (!coachNotes) return null;

      const sessionDate = String(row.session_date);
      return {
        id: row.id as string,
        sessionDate,
        dateLabel: formatSessionDateLabel(sessionDate),
        title: ((row.title as string | null | undefined)?.trim() || defaultSessionTitle(sessionDate)),
        coachNotes,
      };
    })
    .filter((entry): entry is CoachNoteEntry => entry !== null);

  return { notes };
}

export async function fetchHorseFeelingDistribution(
  supabase: SupabaseClient,
  userId: string,
  pedigreeHorseId: string
): Promise<{ distribution: HorseFeelingDistribution[]; error?: string }> {
  const { data, error } = await supabase
    .from("training_sessions")
    .select("horse_feeling")
    .eq("created_by", userId)
    .eq("pedigree_horse_id", pedigreeHorseId)
    .eq("status", "completed")
    .not("horse_feeling", "is", null)
    .neq("horse_feeling", "");

  if (error) {
    if (error.message.includes("horse_feeling")) {
      return { distribution: [] };
    }
    return { distribution: [], error: error.message };
  }

  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const feeling = (row.horse_feeling as string).trim();
    counts.set(feeling, (counts.get(feeling) ?? 0) + 1);
  }

  const distribution = [...counts.entries()]
    .map(([feeling, count]) => ({ feeling, count }))
    .sort((left, right) => right.count - left.count);

  return { distribution };
}

export async function fetchHorseTrainingAnalytics(
  supabase: SupabaseClient,
  userId: string,
  pedigreeHorseId: string,
  horseNameFallback: string
): Promise<{ analytics: HorseTrainingAnalytics; errors?: HorseTrainingAnalyticsErrors }> {
  const errors: HorseTrainingAnalyticsErrors = {};

  const [
    summaryResult,
    ratingsResult,
    loadResult,
    exerciseResult,
    coachNotesResult,
    feelingResult,
  ] = await Promise.all([
    fetchHorseTrainingSummaryFromView(supabase, userId, pedigreeHorseId, horseNameFallback),
    fetchRatingsOverTime(supabase, userId, pedigreeHorseId),
    fetchTrainingLoadLast30Days(supabase, userId, pedigreeHorseId),
    fetchExerciseFrequency(supabase, userId, pedigreeHorseId),
    fetchRecentCoachNotes(supabase, userId, pedigreeHorseId),
    fetchHorseFeelingDistribution(supabase, userId, pedigreeHorseId),
  ]);

  if (summaryResult.error) errors.summary = summaryResult.error;
  if (ratingsResult.error) errors.ratings = ratingsResult.error;
  if (loadResult.error) errors.load = loadResult.error;
  if (exerciseResult.error) errors.exercises = exerciseResult.error;
  if (coachNotesResult.error) errors.coachNotes = coachNotesResult.error;
  if (feelingResult.error) errors.feelings = feelingResult.error;

  const summary = summaryResult.summary;
  const trainingLoad =
    loadResult.load.length > 0
      ? loadResult.load
      : buildEmptyAnalytics(pedigreeHorseId, horseNameFallback).trainingLoad;

  const analyticsBase = {
    summary,
    ratingsOverTime: ratingsResult.ratings,
    trainingLoad,
    exerciseFrequency: exerciseResult.exercises,
    coachNotes: coachNotesResult.notes,
    horseFeelingDistribution: feelingResult.distribution,
  };

  const trainingEvaluation = getRuleEngineProvider().evaluate(buildRuleEvaluationContext(analyticsBase));
  const healthSnapshotResult = await fetchHorseHealthSnapshot(
    supabase,
    userId,
    pedigreeHorseId,
    horseNameFallback
  );
  const healthEvaluation = evaluateHealthRules(healthSnapshotResult.snapshot);

  const analytics: HorseTrainingAnalytics = {
    ...analyticsBase,
    ruleEvaluation: mergeRuleEvaluationWithHealth(trainingEvaluation, healthEvaluation),
  };

  void syncHorseEventsFromAnalytics(
    supabase,
    userId,
    pedigreeHorseId,
    horseNameFallback,
    analytics,
    healthEvaluation
  );

  return {
    analytics,
    errors: Object.keys(errors).length > 0 ? errors : undefined,
  };
}
