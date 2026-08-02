"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  finishTrainingSessionAction,
  saveSessionReflectionAction,
  updateSessionExerciseAction,
} from "@/app/actions/training";
import DashboardCard from "@/app/components/shared/DashboardCard";
import TrainingEmptyState from "@/app/components/training/TrainingEmptyState";
import TrainingErrorState from "@/app/components/training/TrainingErrorState";
import TrainingExerciseExecutionList from "@/app/components/training/TrainingExerciseExecutionList";
import TrainingSessionProgress from "@/app/components/training/TrainingSessionProgress";
import TrainingSessionReflectionForm from "@/app/components/training/TrainingSessionReflectionForm";
import TrainingSessionTimer, { getElapsedMinutes } from "@/app/components/training/TrainingSessionTimer";
import { formatSessionDateLabel } from "@/app/lib/training/format";
import type {
  TrainingSessionDetail,
  TrainingSessionExercise,
  TrainingSessionExerciseStatus,
  TrainingSessionReflection,
  TrainingSessionStatus,
} from "@/app/types/training";

type Props = {
  session: TrainingSessionDetail;
  exercises: TrainingSessionExercise[];
  error?: string;
};

type OptimisticAction =
  | { type: "patch"; exerciseId: string; patch: Partial<TrainingSessionExercise> }
  | { type: "replace"; exercise: TrainingSessionExercise };

function applyOptimisticExerciseUpdate(
  exercises: TrainingSessionExercise[],
  action: OptimisticAction
): TrainingSessionExercise[] {
  if (action.type === "replace") {
    return exercises.map((exercise) =>
      exercise.id === action.exercise.id ? action.exercise : exercise
    );
  }

  return exercises.map((exercise) =>
    exercise.id === action.exerciseId ? { ...exercise, ...action.patch } : exercise
  );
}

function isResolvedStatus(status: TrainingSessionExerciseStatus): boolean {
  return status === "completed" || status === "skipped";
}

export default function TrainingSessionClient({ session, exercises, error }: Props) {
  const t = useTranslations("training");
  const isReadOnly = session.status === "completed";
  const [baseExercises, setBaseExercises] = useState(exercises);
  const [optimisticExercises, applyOptimistic] = useOptimistic(baseExercises, applyOptimisticExerciseUpdate);
  const [reflection, setReflection] = useState<TrainingSessionReflection>({
    riderRating: session.riderRating,
    horseFeeling: session.horseFeeling,
    coachNotes: session.coachNotes,
    notes: session.notes,
  });
  const [savingExerciseId, setSavingExerciseId] = useState<string | null>(null);
  const [reflectionSaving, setReflectionSaving] = useState(false);
  const [reflectionError, setReflectionError] = useState<string | null>(null);
  const [finishError, setFinishError] = useState<string | null>(null);
  const [isFinishing, startFinishTransition] = useTransition();
  const notesDebounceRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const reflectionDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  function sessionStatusLabel(status: TrainingSessionStatus): string {
    return t(`sessionStatus.${status}` as Parameters<typeof t>[0]);
  }

  const resolvedCount = useMemo(
    () => optimisticExercises.filter((exercise) => isResolvedStatus(exercise.status)).length,
    [optimisticExercises]
  );

  const completedCount = useMemo(
    () => optimisticExercises.filter((exercise) => exercise.status === "completed").length,
    [optimisticExercises]
  );

  const allExercisesResolved =
    optimisticExercises.length === 0 ||
    optimisticExercises.every((exercise) => isResolvedStatus(exercise.status));

  const persistReflection = useCallback(
    async (nextReflection: TrainingSessionReflection) => {
      if (isReadOnly) return;

      setReflectionSaving(true);
      setReflectionError(null);

      const result = await saveSessionReflectionAction(session.id, nextReflection);
      if (result.error) {
        setReflectionError(result.error);
      }

      setReflectionSaving(false);
    },
    [isReadOnly, session.id]
  );

  const handleReflectionChange = useCallback(
    (nextReflection: TrainingSessionReflection) => {
      setReflection(nextReflection);

      if (isReadOnly) return;

      if (reflectionDebounceRef.current) {
        clearTimeout(reflectionDebounceRef.current);
      }

      reflectionDebounceRef.current = setTimeout(() => {
        void persistReflection(nextReflection);
      }, 600);
    },
    [isReadOnly, persistReflection]
  );

  useEffect(() => {
    const noteTimers = notesDebounceRef.current;
    return () => {
      Object.values(noteTimers).forEach(clearTimeout);
      if (reflectionDebounceRef.current) {
        clearTimeout(reflectionDebounceRef.current);
      }
    };
  }, []);

  async function persistExerciseUpdate(
    exerciseId: string,
    input: { status?: TrainingSessionExerciseStatus; executionNotes?: string | null },
    previous?: TrainingSessionExercise
  ) {
    setSavingExerciseId(exerciseId);
    const result = await updateSessionExerciseAction(exerciseId, input);
    setSavingExerciseId(null);

    if (result.error || !result.exercise) {
      if (previous) {
        setBaseExercises((current) =>
          current.map((exercise) => (exercise.id === exerciseId ? previous : exercise))
        );
      }
      setFinishError(result.error ?? t("session.exerciseUpdateError"));
      return;
    }

    setBaseExercises((current) =>
      current.map((exercise) => (exercise.id === exerciseId ? result.exercise! : exercise))
    );
    setFinishError(null);
  }

  function handleStartExercise(exerciseId: string) {
    if (isReadOnly) return;

    const previous = baseExercises.find((exercise) => exercise.id === exerciseId);
    if (!previous) return;

    applyOptimistic({ type: "patch", exerciseId, patch: { status: "in_progress" } });
    void persistExerciseUpdate(exerciseId, { status: "in_progress" }, previous);
  }

  function handleCompleteExercise(exerciseId: string) {
    if (isReadOnly) return;

    const previous = baseExercises.find((exercise) => exercise.id === exerciseId);
    if (!previous) return;

    applyOptimistic({ type: "patch", exerciseId, patch: { status: "completed" } });
    void persistExerciseUpdate(exerciseId, { status: "completed" }, previous);
  }

  function handleSkipExercise(exerciseId: string) {
    if (isReadOnly) return;

    const previous = baseExercises.find((exercise) => exercise.id === exerciseId);
    if (!previous) return;

    applyOptimistic({ type: "patch", exerciseId, patch: { status: "skipped" } });
    void persistExerciseUpdate(exerciseId, { status: "skipped" }, previous);
  }

  function handleExerciseNotesChange(exerciseId: string, notes: string) {
    if (isReadOnly) return;

    const previous = baseExercises.find((exercise) => exercise.id === exerciseId);
    if (!previous) return;

    applyOptimistic({ type: "patch", exerciseId, patch: { executionNotes: notes } });

    if (notesDebounceRef.current[exerciseId]) {
      clearTimeout(notesDebounceRef.current[exerciseId]);
    }

    notesDebounceRef.current[exerciseId] = setTimeout(() => {
      void persistExerciseUpdate(exerciseId, { executionNotes: notes }, previous);
    }, 500);
  }

  function handleFinishSession() {
    if (!allExercisesResolved || isFinishing || isReadOnly) return;

    setFinishError(null);
    startFinishTransition(async () => {
      const durationMinutes = getElapsedMinutes(session.startedAt);
      const result = await finishTrainingSessionAction(session.id, {
        ...reflection,
        durationMinutes,
      });

      if (result.error) {
        setFinishError(result.error);
        return;
      }

      router.push(`/training?horseId=${session.pedigreeHorseId}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-white/10 bg-[#111827] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm uppercase tracking-[0.2em] text-blue-400">
              {isReadOnly ? t("session.completedSession") : t("session.activeSession")}
            </p>
            <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl">{session.title}</h1>
            <dl className="mt-4 grid gap-3 text-sm text-gray-300 sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-gray-500">{t("session.horse")}</dt>
                <dd className="mt-1 font-medium text-white">{session.horseName}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-gray-500">{t("session.trainingPlan")}</dt>
                <dd className="mt-1 font-medium text-white">
                  {session.trainingPlanName ?? t("session.noPlanAttached")}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-gray-500">{t("session.date")}</dt>
                <dd className="mt-1">{formatSessionDateLabel(session.sessionDate)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-gray-500">{t("session.status")}</dt>
                <dd className="mt-1">{sessionStatusLabel(session.status)}</dd>
              </div>
            </dl>
            {session.sessionGoal ? (
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-gray-300">{session.sessionGoal}</p>
            ) : null}
          </div>

          <div className="w-full max-w-xs shrink-0">
            <TrainingSessionTimer
              startedAt={session.startedAt}
              isActive={!isReadOnly}
              completedDurationMinutes={session.durationMinutes}
            />
          </div>
        </div>
      </header>

      <DashboardCard
        eyebrow={t("session.exercisesEyebrow")}
        title={t("session.exercisesTitle")}
        description={t("session.exercisesDescription")}
      >
        {error ? (
          <TrainingErrorState message={error} />
        ) : (
          <div className="space-y-4">
            <TrainingSessionProgress
              completedCount={completedCount}
              resolvedCount={resolvedCount}
              totalCount={optimisticExercises.length}
            />
            {optimisticExercises.length > 0 ? (
              <TrainingExerciseExecutionList
                exercises={optimisticExercises}
                disabled={isReadOnly}
                savingExerciseId={savingExerciseId}
                onStart={handleStartExercise}
                onComplete={handleCompleteExercise}
                onSkip={handleSkipExercise}
                onNotesChange={handleExerciseNotesChange}
              />
            ) : (
              <TrainingEmptyState
                title={t("session.noExercisesTitle")}
                description={t("session.noExercisesDescription")}
              />
            )}
          </div>
        )}
      </DashboardCard>

      <DashboardCard
        eyebrow={t("session.reflectionEyebrow")}
        title={t("session.feedbackTitle")}
        description={
          isReadOnly
            ? t("session.feedbackReadOnlyDescription")
            : t("session.feedbackEditDescription")
        }
      >
        <TrainingSessionReflectionForm
          value={reflection}
          onChange={handleReflectionChange}
          disabled={isReadOnly}
        />
        {reflectionSaving ? <p className="mt-4 text-xs text-blue-300">{t("session.savingReflection")}</p> : null}
        {reflectionError ? <p className="mt-4 text-xs text-red-300">{reflectionError}</p> : null}
      </DashboardCard>

      <div className="flex flex-wrap items-center gap-4">
        {!isReadOnly ? (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={!allExercisesResolved || isFinishing}
              onClick={handleFinishSession}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isFinishing ? t("session.finishing") : t("session.finishSession")}
            </button>
            {!allExercisesResolved ? (
              <p className="text-xs text-gray-400">{t("session.completeAllHint")}</p>
            ) : null}
            {finishError ? <p className="text-xs text-red-300">{finishError}</p> : null}
          </div>
        ) : null}
        <Link
          href="/training"
          className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-[#111827] px-5 py-3 text-sm font-semibold text-white transition hover:border-blue-500/40"
        >
          {t("session.backToDailyTraining")}
        </Link>
      </div>
    </div>
  );
}
