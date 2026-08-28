"use client";

import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  getTrainingHorseDashboard,
  getTrainingHorses,
  startTrainingSessionAction,
} from "@/app/actions/training";
import DashboardCard from "@/app/components/shared/DashboardCard";
import TrainingActivityChart from "@/app/components/training/TrainingActivityChart";
import TrainingCalendar from "@/app/components/training/TrainingCalendar";
import TrainingDashboardHeader from "@/app/components/training/TrainingDashboardHeader";
import TrainingAiCoachPanel from "@/app/components/training/analytics/TrainingAiCoachPanel";
import TodaysAlertsWidget from "@/app/components/events/TodaysAlertsWidget";
import TrainingEmptyState from "@/app/components/training/TrainingEmptyState";
import TrainingErrorState from "@/app/components/training/TrainingErrorState";
import TrainingExercisesChecklist from "@/app/components/training/TrainingExercisesChecklist";
import TrainingHorseSelector from "@/app/components/training/TrainingHorseSelector";
import TrainingPlanCard from "@/app/components/training/TrainingPlanCard";
import TrainingRecentNotes from "@/app/components/training/TrainingRecentNotes";
import TrainingRecentSessions from "@/app/components/training/TrainingRecentSessions";
import TrainingSummaryCard from "@/app/components/training/TrainingSummaryCard";
import { createEmptyTrainingCalendarMonth } from "@/app/lib/training/calendar";
import { trainingSessionPath } from "@/app/lib/training/routes";
import type { TrainingDashboardErrors, TrainingHorse, TrainingHorseDashboard } from "@/app/types/training";

const EMPTY_DASHBOARD: TrainingHorseDashboard = {
  plan: null,
  todayExercises: [],
  recentSessions: [],
  summary: {
    totalSessions: 0,
    completedSessions: 0,
    completionRateLabel: "0%",
    lastSessionDate: null,
    lastSessionDateLabel: null,
  },
  activity: [],
  recentNotes: [],
  calendar: createEmptyTrainingCalendarMonth(),
};

export default function TrainingDashboardClient() {
  const t = useTranslations("training");
  const [horses, setHorses] = useState<TrainingHorse[]>([]);
  const [selectedHorseId, setSelectedHorseId] = useState("");
  const [dashboard, setDashboard] = useState<TrainingHorseDashboard>(EMPTY_DASHBOARD);
  const [horsesError, setHorsesError] = useState<string | null>(null);
  const [dashboardErrors, setDashboardErrors] = useState<TrainingDashboardErrors | null>(null);
  const [horsesLoading, setHorsesLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [startingSession, startSessionTransition] = useTransition();
  const [, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const horseIdFromUrl = searchParams.get("horseId");

  const loadDashboard = useCallback((horseId: string) => {
    if (!horseId) {
      setDashboard(EMPTY_DASHBOARD);
      setDashboardErrors(null);
      setSelectedCalendarDate(null);
      setDashboardLoading(false);
      return;
    }

    setDashboardLoading(true);
    setDashboardErrors(null);
    setSelectedCalendarDate(null);

    startTransition(async () => {
      const response = await getTrainingHorseDashboard(horseId);
      setDashboard(response.dashboard);
      setDashboardErrors(response.errors ?? null);
      setDashboardLoading(false);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadHorses() {
      setHorsesLoading(true);
      setHorsesError(null);

      const response = await getTrainingHorses();
      if (cancelled) return;

      setHorses(response.horses);
      setHorsesError(response.error ?? null);
      setHorsesLoading(false);

      const preferredHorseId =
        horseIdFromUrl && response.horses.some((horse) => horse.id === horseIdFromUrl)
          ? horseIdFromUrl
          : response.horses[0]?.id ?? "";
      setSelectedHorseId(preferredHorseId);
      if (preferredHorseId) {
        loadDashboard(preferredHorseId);
      }
    }

    void loadHorses();

    return () => {
      cancelled = true;
    };
  }, [loadDashboard, horseIdFromUrl]);

  function handleHorseSelect(horseId: string) {
    setSelectedHorseId(horseId);
    setSelectedCalendarDate(null);
    setStartError(null);
    loadDashboard(horseId);
  }

  function handleStartSession() {
    if (!selectedHorseId || startingSession) return;

    setStartError(null);
    startSessionTransition(async () => {
      const result = await startTrainingSessionAction(selectedHorseId);
      if (result.error) {
        setStartError(result.error);
        return;
      }
      if (result.sessionId) {
        router.push(trainingSessionPath(result.sessionId));
      }
    });
  }

  const hasSelectedHorse = Boolean(selectedHorseId);
  const selectedHorseName = horses.find((horse) => horse.id === selectedHorseId)?.name ?? "Horse";
  const canStartSession = hasSelectedHorse && !horsesLoading && !startingSession;

  return (
    <div className="space-y-8">
      <TrainingDashboardHeader />

      {hasSelectedHorse ? (
        <TrainingAiCoachPanel horseId={selectedHorseId} horseName={selectedHorseName} />
      ) : null}

      {hasSelectedHorse ? (
        <DashboardCard
          eyebrow={t("dashboard.alertsEyebrow")}
          title={t("dashboard.alertsTitle")}
          description={t("dashboard.alertsDescription")}
          loading={dashboardLoading}
        >
          {!dashboardLoading ? <TodaysAlertsWidget horseId={selectedHorseId} /> : null}
        </DashboardCard>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard
          eyebrow={t("dashboard.horseEyebrow")}
          title={t("dashboard.selectHorseTitle")}
          description={t("dashboard.selectHorseDescription")}
          loading={horsesLoading}
        >
          {!horsesLoading ? (
            horsesError ? (
              <TrainingErrorState message={horsesError} />
            ) : (
              <TrainingHorseSelector
                horses={horses}
                selectedHorseId={selectedHorseId}
                onSelect={handleHorseSelect}
              />
            )
          ) : null}
        </DashboardCard>

        <DashboardCard
          eyebrow={t("dashboard.scheduleEyebrow")}
          title={t("dashboard.todaysPlanTitle")}
          description={t("dashboard.todaysPlanDescription")}
          loading={dashboardLoading && hasSelectedHorse}
        >
          {!dashboardLoading || !hasSelectedHorse ? (
            dashboardErrors?.general ? (
              <TrainingErrorState message={dashboardErrors.general} />
            ) : !hasSelectedHorse ? (
              <TrainingEmptyState
                title={t("empty.selectHorseTitle")}
                description={t("empty.selectHorsePlanDescription")}
              />
            ) : dashboardErrors?.plan ? (
              <TrainingErrorState message={dashboardErrors.plan} />
            ) : dashboard.plan ? (
              <TrainingPlanCard plan={dashboard.plan} />
            ) : (
              <TrainingEmptyState
                title={t("empty.noActivePlanTitle")}
                description={t("empty.noActivePlanDescription")}
              />
            )
          ) : null}
        </DashboardCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard
          eyebrow={t("dashboard.sessionOutlineEyebrow")}
          title={t("dashboard.todaysExercisesTitle")}
          description={t("dashboard.todaysExercisesDescription")}
          loading={dashboardLoading && hasSelectedHorse}
        >
          {!dashboardLoading || !hasSelectedHorse ? (
            dashboardErrors?.general ? (
              <TrainingErrorState message={dashboardErrors.general} />
            ) : !hasSelectedHorse ? (
              <TrainingEmptyState
                title={t("empty.selectHorseTitle")}
                description={t("empty.selectHorseExercisesDescription")}
              />
            ) : dashboardErrors?.exercises ? (
              <TrainingErrorState message={dashboardErrors.exercises} />
            ) : dashboard.todayExercises.length > 0 ? (
              <TrainingExercisesChecklist exercises={dashboard.todayExercises} />
            ) : (
              <TrainingEmptyState
                title={t("empty.noExercisesTitle")}
                description={t("empty.noExercisesDescription")}
              />
            )
          ) : null}
        </DashboardCard>

        <DashboardCard
          eyebrow={t("dashboard.historyEyebrow")}
          title={t("dashboard.recentSessionsTitle")}
          description={t("dashboard.recentSessionsDescription")}
          loading={dashboardLoading && hasSelectedHorse}
        >
          {!dashboardLoading || !hasSelectedHorse ? (
            dashboardErrors?.general ? (
              <TrainingErrorState message={dashboardErrors.general} />
            ) : !hasSelectedHorse ? (
              <TrainingEmptyState
                title={t("empty.selectHorseTitle")}
                description={t("empty.selectHorseSessionsDescription")}
              />
            ) : dashboardErrors?.sessions ? (
              <TrainingErrorState message={dashboardErrors.sessions} />
            ) : dashboard.recentSessions.length > 0 ? (
              <TrainingRecentSessions sessions={dashboard.recentSessions} />
            ) : (
              <TrainingEmptyState
                title={t("empty.noSessionsTitle")}
                description={t("empty.noSessionsDescription")}
              />
            )
          ) : null}
        </DashboardCard>
      </div>

      <DashboardCard
        eyebrow={t("dashboard.scheduleEyebrow")}
        title={t("dashboard.calendarTitle")}
        description={t("dashboard.calendarDescription")}
        loading={dashboardLoading && hasSelectedHorse}
      >
        {!dashboardLoading || !hasSelectedHorse ? (
          dashboardErrors?.general ? (
            <TrainingErrorState message={dashboardErrors.general} />
          ) : !hasSelectedHorse ? (
            <TrainingEmptyState
              title={t("empty.selectHorseTitle")}
              description={t("empty.selectHorseCalendarDescription")}
            />
          ) : dashboardErrors?.calendar ? (
            <TrainingErrorState message={dashboardErrors.calendar} />
          ) : (
            <TrainingCalendar
              calendar={dashboard.calendar}
              selectedDate={selectedCalendarDate}
              onSelectDate={setSelectedCalendarDate}
            />
          )
        ) : null}
      </DashboardCard>

      <DashboardCard
        eyebrow={t("dashboard.performanceEyebrow")}
        title={t("dashboard.summaryTitle")}
        description={t("dashboard.summaryDescription")}
        loading={dashboardLoading && hasSelectedHorse}
      >
        {!dashboardLoading || !hasSelectedHorse ? (
          dashboardErrors?.general ? (
            <TrainingErrorState message={dashboardErrors.general} />
          ) : !hasSelectedHorse ? (
            <TrainingEmptyState
              title={t("empty.selectHorseTitle")}
              description={t("empty.selectHorseSummaryDescription")}
            />
          ) : dashboardErrors?.summary ? (
            <TrainingErrorState message={dashboardErrors.summary} />
          ) : (
            <TrainingSummaryCard summary={dashboard.summary} />
          )
        ) : null}
      </DashboardCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard
          eyebrow={t("dashboard.trendEyebrow")}
          title={t("dashboard.activityTitle")}
          description={t("dashboard.activityDescription")}
          loading={dashboardLoading && hasSelectedHorse}
        >
          {!dashboardLoading || !hasSelectedHorse ? (
            dashboardErrors?.general ? (
              <TrainingErrorState message={dashboardErrors.general} />
            ) : !hasSelectedHorse ? (
              <TrainingEmptyState
                title={t("empty.selectHorseTitle")}
                description={t("empty.selectHorseActivityDescription")}
              />
            ) : dashboardErrors?.activity ? (
              <TrainingErrorState message={dashboardErrors.activity} />
            ) : dashboard.activity.some((day) => day.sessionCount > 0) ? (
              <TrainingActivityChart activity={dashboard.activity} />
            ) : (
              <TrainingEmptyState
                title={t("empty.noActivityTitle")}
                description={t("empty.noActivityDescription")}
              />
            )
          ) : null}
        </DashboardCard>

        <DashboardCard
          eyebrow={t("dashboard.reflectionEyebrow")}
          title={t("dashboard.recentNotesTitle")}
          description={t("dashboard.recentNotesDescription")}
          loading={dashboardLoading && hasSelectedHorse}
        >
          {!dashboardLoading || !hasSelectedHorse ? (
            dashboardErrors?.general ? (
              <TrainingErrorState message={dashboardErrors.general} />
            ) : !hasSelectedHorse ? (
              <TrainingEmptyState
                title={t("empty.selectHorseTitle")}
                description={t("empty.selectHorseNotesDescription")}
              />
            ) : dashboardErrors?.notes ? (
              <TrainingErrorState message={dashboardErrors.notes} />
            ) : dashboard.recentNotes.length > 0 ? (
              <TrainingRecentNotes notes={dashboard.recentNotes} />
            ) : (
              <TrainingEmptyState
                title={t("empty.noNotesTitle")}
                description={t("empty.noNotesDescription")}
              />
            )
          ) : null}
        </DashboardCard>
      </div>

      <DashboardCard
        title={t("dashboard.readyTitle")}
        description={t("dashboard.readyDescription")}
        titleAs="h3"
        headerSize="compact"
        className="p-6 sm:p-8"
        action={
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            <button
              type="button"
              disabled={!canStartSession}
              onClick={handleStartSession}
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {startingSession ? t("dashboard.startingSession") : t("dashboard.startSession")}
            </button>
            {startError ? (
              <p className="max-w-xs text-right text-xs text-red-300">{startError}</p>
            ) : null}
          </div>
        }
      />
    </div>
  );
}
