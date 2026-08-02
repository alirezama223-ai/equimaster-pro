"use client";

import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useTransition } from "react";
import {
  getExerciseLibrary,
  getTrainingHorses,
  saveTrainingPlanEditor,
  updateTrainingPlanStatusAction,
} from "@/app/actions/training-plans";
import ExercisePickerModal from "@/app/components/training/plans/ExercisePickerModal";
import TrainingPlanAssignedHorses from "@/app/components/training/plans/TrainingPlanAssignedHorses";
import TrainingPlanDayCard from "@/app/components/training/plans/TrainingPlanDayCard";
import TrainingPlanEditorActions from "@/app/components/training/plans/TrainingPlanEditorActions";
import TrainingPlanHeader from "@/app/components/training/plans/TrainingPlanHeader";
import TrainingPlanWeekTabs from "@/app/components/training/plans/TrainingPlanWeekTabs";
import TrainingErrorState from "@/app/components/training/TrainingErrorState";
import {
  cloneEditorWeeks,
  isTrainingPlanAssignmentsDirty,
  isTrainingPlanEditorDirty,
} from "@/app/lib/training/plans/editor-serialize";
import {
  formatTrainingPlanDayHeading,
  type TrainingPlanEditorData,
} from "@/app/lib/training/plans/editor-types";
import {
  addExerciseToDay,
  addWeek,
  findDayById,
  moveExerciseInDay,
  removeExerciseFromDay,
  setDayRestDay,
  updateDayDetails,
  updateWeekDetails,
} from "@/app/lib/training/plans/editor-state";
import type { ExerciseLibraryItem } from "@/app/lib/training/plans/exercises";
import type { TrainingHorse } from "@/app/types/training";
import type { TrainingPlanStatus } from "@/app/types/training-plans";

type Props = {
  plan: TrainingPlanEditorData;
  loadError?: string | null;
  assignmentLoadError?: string | null;
};

function cloneHorseIds(horseIds: string[]): string[] {
  return [...horseIds];
}

export default function TrainingPlanEditor({ plan, loadError, assignmentLoadError }: Props) {
  const t = useTranslations("training");
  const [savedWeeks, setSavedWeeks] = useState(plan.weeks);
  const [weeks, setWeeks] = useState(plan.weeks);
  const [savedHorseIds, setSavedHorseIds] = useState(plan.assignedHorseIds);
  const [assignedHorseIds, setAssignedHorseIds] = useState(plan.assignedHorseIds);
  const [planMeta, setPlanMeta] = useState(plan);
  const [manageableHorses, setManageableHorses] = useState<TrainingHorse[]>([]);
  const [horsesLoading, setHorsesLoading] = useState(true);
  const [horsesError, setHorsesError] = useState<string | null>(null);
  const [selectedWeekId, setSelectedWeekId] = useState(plan.weeks[0]?.id ?? "");
  const [pickerDayId, setPickerDayId] = useState<string | null>(null);
  const [libraryExercises, setLibraryExercises] = useState<ExerciseLibraryItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(true);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isSaving, startSaveTransition] = useTransition();
  const [isStatusUpdating, startStatusTransition] = useTransition();

  const isStructureDirty = useMemo(
    () => isTrainingPlanEditorDirty(savedWeeks, weeks),
    [savedWeeks, weeks]
  );

  const isAssignmentsDirty = useMemo(
    () => isTrainingPlanAssignmentsDirty(savedHorseIds, assignedHorseIds),
    [savedHorseIds, assignedHorseIds]
  );

  const isDirty = isStructureDirty || isAssignmentsDirty;

  const selectedWeek = useMemo(
    () => weeks.find((week) => week.id === selectedWeekId) ?? weeks[0] ?? null,
    [weeks, selectedWeekId]
  );

  const pickerDay = pickerDayId ? findDayById(weeks, pickerDayId) : null;

  useEffect(() => {
    let cancelled = false;

    async function loadSupportingData() {
      console.log("[TrainingPlanEditor] loadSupportingData called on mount (not on Add Exercise click)");
      setLibraryLoading(true);
      setHorsesLoading(true);
      setLibraryError(null);
      setHorsesError(null);

      console.log("Loading exercises...");
      const [libraryResponse, horsesResponse] = await Promise.all([
        getExerciseLibrary(),
        getTrainingHorses(),
      ]);
      console.log("Loading exercises... data", libraryResponse.exercises);
      console.log("Loading exercises... error", libraryResponse.error ?? null);

      if (cancelled) return;

      console.log("[TrainingPlanEditor] getExerciseLibrary response", {
        exerciseCount: libraryResponse.exercises.length,
        error: libraryResponse.error ?? null,
        sample: libraryResponse.exercises.slice(0, 3).map((exercise) => ({
          id: exercise.id,
          name: exercise.name,
          category: exercise.category,
        })),
      });

      setLibraryExercises(libraryResponse.exercises);
      setLibraryError(libraryResponse.error ?? null);
      setLibraryLoading(false);

      setManageableHorses(horsesResponse.horses);
      setHorsesError(horsesResponse.error ?? null);
      setHorsesLoading(false);
    }

    void loadSupportingData();

    return () => {
      cancelled = true;
    };
  }, []);

  function openPicker(dayId: string) {
    console.log("[TrainingPlanEditor] Add Exercise clicked -> openPicker", {
      dayId,
      note: "Does not fetch exercises. Modal uses libraryExercises loaded on mount.",
      libraryLoading,
      libraryError,
      cachedExerciseCount: libraryExercises.length,
    });
    setPickerDayId(dayId);
  }

  function closePicker() {
    setPickerDayId(null);
  }

  function handleSelectExercise(exercise: ExerciseLibraryItem) {
    if (!pickerDayId) return;

    setWeeks((current) => addExerciseToDay(current, pickerDayId, exercise));
    closePicker();
  }

  function handleMoveExerciseUp(dayId: string, exerciseInstanceId: string) {
    setWeeks((current) => moveExerciseInDay(current, dayId, exerciseInstanceId, "up"));
  }

  function handleMoveExerciseDown(dayId: string, exerciseInstanceId: string) {
    setWeeks((current) => moveExerciseInDay(current, dayId, exerciseInstanceId, "down"));
  }

  function handleRemoveExercise(dayId: string, exerciseInstanceId: string) {
    setWeeks((current) => removeExerciseFromDay(current, dayId, exerciseInstanceId));
  }

  function handleToggleRestDay(dayId: string, isRestDay: boolean) {
    setWeeks((current) => setDayRestDay(current, dayId, isRestDay));
  }

  function handleAddWeek() {
    setWeeks((current) => {
      const nextWeeks = addWeek(current);
      setSelectedWeekId(nextWeeks[nextWeeks.length - 1]?.id ?? selectedWeekId);
      return nextWeeks;
    });
  }

  function handleUpdateWeekTitle(weekId: string, title: string) {
    setWeeks((current) =>
      updateWeekDetails(current, weekId, { title: title.trim() || null })
    );
  }

  function handleUpdateWeekGoal(weekId: string, goal: string) {
    setWeeks((current) => updateWeekDetails(current, weekId, { goal: goal.trim() || null }));
  }

  function handleUpdateDayTitle(dayId: string, title: string) {
    setWeeks((current) => updateDayDetails(current, dayId, { title: title.trim() || null }));
  }

  function handleUpdateDayGoal(dayId: string, goal: string) {
    setWeeks((current) => updateDayDetails(current, dayId, { goal: goal.trim() || null }));
  }

  function handleStatusChange(status: TrainingPlanStatus) {
    if (status === planMeta.status) return;

    setStatusError(null);
    startStatusTransition(async () => {
      const result = await updateTrainingPlanStatusAction(planMeta.id, status);
      if (result.error) {
        setStatusError(result.error);
        return;
      }

      setPlanMeta((current) => ({ ...current, status }));
    });
  }

  function handleToggleAssignedHorse(horseId: string) {
    setAssignedHorseIds((current) =>
      current.includes(horseId)
        ? current.filter((id) => id !== horseId)
        : [...current, horseId]
    );
  }

  function handleCancel() {
    setWeeks(cloneEditorWeeks(savedWeeks));
    setAssignedHorseIds(cloneHorseIds(savedHorseIds));
    setSaveError(null);
  }

  function handleSave() {
    setSaveError(null);
    startSaveTransition(async () => {
      const result = await saveTrainingPlanEditor(planMeta.id, {
        weeks,
        assignedHorseIds,
        saveStructure: isStructureDirty,
        saveAssignments: isAssignmentsDirty,
      });

      if (result.error || !result.plan) {
        setSaveError(result.error ?? t("plans.saveError"));
        return;
      }

      setPlanMeta(result.plan);
      setSavedWeeks(cloneEditorWeeks(result.plan.weeks));
      setWeeks(cloneEditorWeeks(result.plan.weeks));
      setSavedHorseIds(cloneHorseIds(result.plan.assignedHorseIds));
      setAssignedHorseIds(cloneHorseIds(result.plan.assignedHorseIds));
      setSelectedWeekId((current) => {
        const stillExists = result.plan!.weeks.some((week) => week.id === current);
        return stillExists ? current : (result.plan!.weeks[0]?.id ?? "");
      });
    });
  }

  return (
    <div className="space-y-8">
      <TrainingPlanHeader
        plan={{
          ...planMeta,
          weekCount: weeks.length,
          durationLabel: t("plans.weekCount", { count: weeks.length }),
        }}
        statusUpdating={isStatusUpdating}
        statusError={statusError}
        onStatusChange={handleStatusChange}
      />

      {loadError ? <TrainingErrorState message={loadError} /> : null}

      <TrainingPlanEditorActions
        isDirty={isDirty}
        isSaving={isSaving}
        saveError={saveError}
        onSave={handleSave}
        onCancel={handleCancel}
      />

      <TrainingPlanAssignedHorses
        horses={manageableHorses}
        selectedHorseIds={assignedHorseIds}
        loading={horsesLoading}
        error={assignmentLoadError ?? horsesError}
        onToggleHorse={handleToggleAssignedHorse}
      />

      <section className="space-y-5">
        <div>
          <h2 className="text-xl font-bold text-white">{t("plans.weeklySchedule")}</h2>
          {selectedWeek?.goal ? (
            <p className="mt-1 text-sm text-gray-400">{selectedWeek.goal}</p>
          ) : null}
        </div>

        <TrainingPlanWeekTabs
          weeks={weeks}
          selectedWeekId={selectedWeek?.id ?? selectedWeekId}
          onSelectWeek={setSelectedWeekId}
          onAddWeek={handleAddWeek}
        />

        {selectedWeek ? (
          <div className="rounded-2xl border border-white/10 bg-[#111827] p-4 sm:p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-xs uppercase tracking-[0.16em] text-gray-500">{t("plans.weekTitle")}</span>
                <input
                  type="text"
                  value={selectedWeek.title ?? ""}
                  onChange={(event) => handleUpdateWeekTitle(selectedWeek.id, event.target.value)}
                  placeholder={t("plans.weekTitlePlaceholder", { number: selectedWeek.weekNumber })}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#08111F] px-3 py-2 text-sm font-semibold text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </label>
              <label className="block">
                <span className="text-xs uppercase tracking-[0.16em] text-gray-500">{t("plans.weekGoal")}</span>
                <input
                  type="text"
                  value={selectedWeek.goal ?? ""}
                  onChange={(event) => handleUpdateWeekGoal(selectedWeek.id, event.target.value)}
                  placeholder={t("plans.weekGoalPlaceholder")}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#08111F] px-3 py-2 text-sm text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </label>
            </div>
          </div>
        ) : null}

        {selectedWeek ? (
          <div
            key={selectedWeek.id}
            className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
            role="tabpanel"
            aria-label={t("plans.weekDaysAriaLabel", { number: selectedWeek.weekNumber })}
          >
            {selectedWeek.days.map((day) => (
              <TrainingPlanDayCard
                key={day.id}
                day={day}
                onAddExercise={() => openPicker(day.id)}
                onMoveExerciseUp={(exerciseInstanceId) =>
                  handleMoveExerciseUp(day.id, exerciseInstanceId)
                }
                onMoveExerciseDown={(exerciseInstanceId) =>
                  handleMoveExerciseDown(day.id, exerciseInstanceId)
                }
                onRemoveExercise={(exerciseInstanceId) =>
                  handleRemoveExercise(day.id, exerciseInstanceId)
                }
                onToggleRestDay={(isRestDay) => handleToggleRestDay(day.id, isRestDay)}
                onUpdateTitle={(title) => handleUpdateDayTitle(day.id, title)}
                onUpdateGoal={(goal) => handleUpdateDayGoal(day.id, goal)}
              />
            ))}
          </div>
        ) : null}
      </section>

      <ExercisePickerModal
        isOpen={pickerDayId != null}
        dayLabel={pickerDay ? formatTrainingPlanDayHeading(pickerDay) : t("plans.thisDay")}
        exercises={libraryExercises}
        loading={libraryLoading}
        error={libraryError}
        onClose={closePicker}
        onSelect={handleSelectExercise}
      />
    </div>
  );
}
