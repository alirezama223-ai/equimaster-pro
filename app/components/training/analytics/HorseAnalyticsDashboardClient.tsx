"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  getHorseTrainingAnalytics,
  getTrainingAnalyticsHorses,
} from "@/app/actions/training-analytics";
import DashboardCard from "@/app/components/shared/DashboardCard";
import HorseAnalyticsSummaryGrid from "@/app/components/training/analytics/HorseAnalyticsSummaryGrid";
import HorseCoachNotesList from "@/app/components/training/analytics/HorseCoachNotesList";
import HorseExerciseFrequencyChart from "@/app/components/training/analytics/HorseExerciseFrequencyChart";
import HorseFeelingDistributionChart from "@/app/components/training/analytics/HorseFeelingDistributionChart";
import HorseRatingsChart from "@/app/components/training/analytics/HorseRatingsChart";
import HorseReadinessScoreCard from "@/app/components/training/analytics/HorseReadinessScoreCard";
import HorseRuleInsightsPanel from "@/app/components/training/analytics/HorseRuleInsightsPanel";
import HorseHealthAlertsPanel from "@/app/components/health/HorseHealthAlertsPanel";
import HorseTrainingLoadChart from "@/app/components/training/analytics/HorseTrainingLoadChart";
import TrainingEmptyState from "@/app/components/training/TrainingEmptyState";
import TrainingErrorState from "@/app/components/training/TrainingErrorState";
import TrainingHorseSelector from "@/app/components/training/TrainingHorseSelector";
import { evaluateHorseTrainingRules } from "@/app/lib/training/rules";
import type {
  HorseTrainingAnalytics,
  HorseTrainingAnalyticsErrors,
} from "@/app/types/training-analytics";
import type { TrainingHorse } from "@/app/types/training";

type Props = {
  initialHorseId?: string;
  backHref?: string;
  backLabel?: string;
};

const EMPTY_ANALYTICS: HorseTrainingAnalytics = {
  summary: {
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
  },
  ratingsOverTime: [],
  trainingLoad: [],
  exerciseFrequency: [],
  coachNotes: [],
  horseFeelingDistribution: [],
  ruleEvaluation: evaluateHorseTrainingRules({
    summary: {
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
    },
    ratingsOverTime: [],
    trainingLoad: [],
    exerciseFrequency: [],
    coachNotes: [],
    horseFeelingDistribution: [],
  }),
};

export default function HorseAnalyticsDashboardClient({
  initialHorseId,
  backHref = "/training",
  backLabel,
}: Props) {
  const t = useTranslations("training");
  const resolvedBackLabel = backLabel ?? t("analytics.backToDailyTraining");
  const [horses, setHorses] = useState<TrainingHorse[]>([]);
  const [selectedHorseId, setSelectedHorseId] = useState(initialHorseId ?? "");
  const [analytics, setAnalytics] = useState<HorseTrainingAnalytics>(EMPTY_ANALYTICS);
  const [errors, setErrors] = useState<HorseTrainingAnalyticsErrors | null>(null);
  const [horsesError, setHorsesError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [horsesLoading, setHorsesLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const searchParams = useSearchParams();
  const horseIdFromUrl = searchParams.get("horseId");

  const loadAnalytics = useCallback((horseId: string) => {
    if (!horseId) {
      setAnalytics(EMPTY_ANALYTICS);
      setErrors(null);
      setPageError(null);
      setAnalyticsLoading(false);
      return;
    }

    setAnalyticsLoading(true);
    setPageError(null);
    setErrors(null);

    startTransition(async () => {
      const result = await getHorseTrainingAnalytics(horseId);
      if (result.error) {
        setPageError(result.error);
        setAnalytics(EMPTY_ANALYTICS);
      } else if (result.analytics) {
        setAnalytics(result.analytics);
        setErrors(result.errors ?? null);
      }
      setAnalyticsLoading(false);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadHorses() {
      setHorsesLoading(true);
      setHorsesError(null);

      const response = await getTrainingAnalyticsHorses();
      if (cancelled) return;

      setHorses(response.horses);
      setHorsesError(response.error ?? null);
      setHorsesLoading(false);

      const preferredHorseId =
        (initialHorseId && response.horses.some((horse) => horse.id === initialHorseId)
          ? initialHorseId
          : null) ??
        (horseIdFromUrl && response.horses.some((horse) => horse.id === horseIdFromUrl)
          ? horseIdFromUrl
          : null) ??
        response.horses[0]?.id ??
        "";

      setSelectedHorseId(preferredHorseId);
      if (preferredHorseId) {
        loadAnalytics(preferredHorseId);
      }
    }

    void loadHorses();

    return () => {
      cancelled = true;
    };
  }, [horseIdFromUrl, initialHorseId, loadAnalytics]);

  function handleHorseSelect(horseId: string) {
    setSelectedHorseId(horseId);
    router.replace(`/training/analytics?horseId=${horseId}`);
    loadAnalytics(horseId);
  }

  const hasSelectedHorse = Boolean(selectedHorseId);
  const selectedHorseName =
    horses.find((horse) => horse.id === selectedHorseId)?.name ?? analytics.summary.horseName;

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-white/10 bg-[#111827] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-blue-400">{t("analytics.eyebrow")}</p>
            <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl">{t("analytics.title")}</h1>
            <p className="mt-3 max-w-2xl text-gray-400">{t("analytics.description")}</p>
          </div>
          <Link
            href={backHref}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-[#08111F] px-5 py-3 text-sm font-semibold text-white transition hover:border-blue-500/40"
          >
            {resolvedBackLabel}
          </Link>
        </div>
      </header>

      <DashboardCard
        eyebrow={t("dashboard.horseEyebrow")}
        title={t("analytics.selectHorseTitle")}
        description={t("analytics.selectHorseDescription")}
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

      {!hasSelectedHorse && !horsesLoading ? (
        <TrainingEmptyState
          title={t("analytics.selectHorseEmptyTitle")}
          description={t("analytics.selectHorseEmptyDescription")}
        />
      ) : null}

      {pageError ? <TrainingErrorState message={pageError} /> : null}
      {errors?.summary ? <TrainingErrorState message={errors.summary} /> : null}

      {hasSelectedHorse ? (
        <>
          <DashboardCard
            eyebrow={selectedHorseName}
            title={t("analytics.summaryTitle")}
            description={t("analytics.summaryDescription")}
            loading={analyticsLoading}
          >
            {!analyticsLoading ? <HorseAnalyticsSummaryGrid summary={analytics.summary} /> : null}
          </DashboardCard>

          <HorseReadinessScoreCard evaluation={analytics.ruleEvaluation} />

          {analytics.ruleEvaluation.healthAlerts.length > 0 ? (
            <DashboardCard
              eyebrow={t("analytics.healthAlertsEyebrow")}
              title={t("analytics.healthAlertsTitle")}
              description={t("analytics.healthAlertsDescription")}
              loading={analyticsLoading}
            >
              {!analyticsLoading ? (
                <HorseHealthAlertsPanel
                  alerts={analytics.ruleEvaluation.healthAlerts}
                  healthScore={analytics.ruleEvaluation.healthScore ?? 100}
                />
              ) : null}
            </DashboardCard>
          ) : null}

          <DashboardCard
            eyebrow={t("analytics.insightsEyebrow")}
            title={t("analytics.insightsTitle")}
            description={t("analytics.insightsDescription")}
            loading={analyticsLoading}
          >
            {!analyticsLoading ? (
              <HorseRuleInsightsPanel evaluation={analytics.ruleEvaluation} />
            ) : null}
          </DashboardCard>

          <div className="grid gap-6 xl:grid-cols-2">
            <DashboardCard
              eyebrow={t("analytics.ratingsEyebrow")}
              title={t("analytics.ratingsTitle")}
              description={t("analytics.ratingsDescription")}
              loading={analyticsLoading}
            >
              {!analyticsLoading ? (
                errors?.ratings ? (
                  <TrainingErrorState message={errors.ratings} />
                ) : (
                  <HorseRatingsChart ratings={analytics.ratingsOverTime} />
                )
              ) : null}
            </DashboardCard>

            <DashboardCard
              eyebrow={t("analytics.loadEyebrow")}
              title={t("analytics.loadTitle")}
              description={t("analytics.loadDescription")}
              loading={analyticsLoading}
            >
              {!analyticsLoading ? (
                errors?.load ? (
                  <TrainingErrorState message={errors.load} />
                ) : (
                  <HorseTrainingLoadChart load={analytics.trainingLoad} />
                )
              ) : null}
            </DashboardCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <DashboardCard
              eyebrow={t("analytics.frequencyEyebrow")}
              title={t("analytics.frequencyTitle")}
              description={t("analytics.frequencyDescription")}
              loading={analyticsLoading}
            >
              {!analyticsLoading ? (
                errors?.exercises ? (
                  <TrainingErrorState message={errors.exercises} />
                ) : (
                  <HorseExerciseFrequencyChart exercises={analytics.exerciseFrequency} />
                )
              ) : null}
            </DashboardCard>

            <DashboardCard
              eyebrow={t("analytics.feelingsEyebrow")}
              title={t("analytics.feelingsTitle")}
              description={t("analytics.feelingsDescription")}
              loading={analyticsLoading}
            >
              {!analyticsLoading ? (
                errors?.feelings ? (
                  <TrainingErrorState message={errors.feelings} />
                ) : (
                  <HorseFeelingDistributionChart distribution={analytics.horseFeelingDistribution} />
                )
              ) : null}
            </DashboardCard>
          </div>

          <DashboardCard
            eyebrow={t("analytics.coachNotesEyebrow")}
            title={t("analytics.coachNotesTitle")}
            description={t("analytics.coachNotesDescription")}
            loading={analyticsLoading}
          >
            {!analyticsLoading ? (
              errors?.coachNotes ? (
                <TrainingErrorState message={errors.coachNotes} />
              ) : (
                <HorseCoachNotesList notes={analytics.coachNotes} />
              )
            ) : null}
          </DashboardCard>
        </>
      ) : null}
    </div>
  );
}
