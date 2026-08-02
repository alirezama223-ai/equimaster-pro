"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import {
  getHealthDashboardHorses,
  getHorseHealthDashboard,
  getTodayHealthCheck,
} from "@/app/actions/health";
import DashboardCard from "@/app/components/shared/DashboardCard";
import DailyHealthCheckForm from "@/app/components/health/DailyHealthCheckForm";
import HorseHealthAlertsPanel from "@/app/components/health/HorseHealthAlertsPanel";
import HorseHealthRecordsPanel from "@/app/components/health/HorseHealthRecordsPanel";
import HorseHealthSummaryGrid from "@/app/components/health/HorseHealthSummaryGrid";
import EmptyState from "@/app/components/shared/EmptyState";
import ErrorState from "@/app/components/shared/ErrorState";
import TrainingHorseSelector from "@/app/components/training/TrainingHorseSelector";
import { evaluateHealthRules } from "@/app/lib/health/rules";
import type { HealthCheck, HorseHealthDashboard } from "@/app/types/health";
import type { TrainingHorse } from "@/app/types/training";

type Props = {
  initialHorseId?: string;
  backHref?: string;
  backLabel?: string;
};

const EMPTY_SNAPSHOT = {
  pedigreeHorseId: "",
  horseName: "Unknown horse",
  latestCheck: null,
  recentChecks: [],
  activeInjuries: [],
  latestFarrierVisit: null,
  overdueVaccinations: [],
  activeMedications: [],
  recentVetVisits: [],
  vaccinationRecordCount: 0,
};

const EMPTY_DASHBOARD: HorseHealthDashboard = {
  snapshot: EMPTY_SNAPSHOT,
  evaluation: evaluateHealthRules(EMPTY_SNAPSHOT),
  checks: [],
  injuries: [],
  farrierVisits: [],
  vetVisits: [],
  vaccinations: [],
  medications: [],
};

export default function HorseHealthDashboardClient({
  initialHorseId,
  backHref = "/training",
  backLabel,
}: Props) {
  const t = useTranslations("health");
  const resolvedBackLabel = backLabel ?? t("dashboard.backToTraining");
  const router = useRouter();
  const searchParams = useSearchParams();
  const horseIdFromUrl = searchParams.get("horseId");
  const [, startTransition] = useTransition();

  const [horses, setHorses] = useState<TrainingHorse[]>([]);
  const [selectedHorseId, setSelectedHorseId] = useState(initialHorseId ?? "");
  const [dashboard, setDashboard] = useState<HorseHealthDashboard>(EMPTY_DASHBOARD);
  const [todayCheck, setTodayCheck] = useState<HealthCheck | null>(null);
  const [horsesLoading, setHorsesLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [horsesError, setHorsesError] = useState<string | null>(null);

  const loadDashboard = useCallback((horseId: string) => {
    if (!horseId) {
      setDashboard(EMPTY_DASHBOARD);
      setTodayCheck(null);
      setPageError(null);
      setDashboardLoading(false);
      return;
    }

    setDashboardLoading(true);
    setPageError(null);

    startTransition(async () => {
      const [dashboardResult, todayResult] = await Promise.all([
        getHorseHealthDashboard(horseId),
        getTodayHealthCheck(horseId),
      ]);

      if (dashboardResult.error) {
        setPageError(dashboardResult.error);
        setDashboard(EMPTY_DASHBOARD);
      } else if (dashboardResult.dashboard) {
        setDashboard(dashboardResult.dashboard);
      }

      setTodayCheck(todayResult.check ?? null);
      setDashboardLoading(false);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadHorses() {
      setHorsesLoading(true);
      setHorsesError(null);

      const result = await getHealthDashboardHorses();
      if (cancelled) return;

      setHorses(result.horses);
      setHorsesError(result.error ?? null);
      setHorsesLoading(false);

      const preferredHorseId =
        (initialHorseId && result.horses.some((horse) => horse.id === initialHorseId)
          ? initialHorseId
          : null) ??
        (horseIdFromUrl && result.horses.some((horse) => horse.id === horseIdFromUrl)
          ? horseIdFromUrl
          : null) ??
        result.horses[0]?.id ??
        "";

      setSelectedHorseId(preferredHorseId);
      if (preferredHorseId) {
        loadDashboard(preferredHorseId);
      }
    }

    void loadHorses();

    return () => {
      cancelled = true;
    };
  }, [horseIdFromUrl, initialHorseId, loadDashboard]);

  function handleHorseChange(horseId: string) {
    setSelectedHorseId(horseId);
    router.replace(`/training/health?horseId=${horseId}`);
    loadDashboard(horseId);
  }

  function handleRefresh() {
    if (selectedHorseId) {
      loadDashboard(selectedHorseId);
    }
  }

  const horseName =
    horses.find((horse) => horse.id === selectedHorseId)?.name ?? dashboard.snapshot.horseName;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          {backHref ? (
            <Link href={backHref} className="text-sm text-gray-400 transition hover:text-white">
              ← {resolvedBackLabel}
            </Link>
          ) : null}
          <h1 className="mt-3 text-4xl font-bold text-white">{t("dashboard.title")}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-400">
            {t("dashboard.description")}
          </p>
        </div>

        {!horsesLoading && horses.length > 0 ? (
          <TrainingHorseSelector
            horses={horses}
            selectedHorseId={selectedHorseId}
            onSelect={handleHorseChange}
          />
        ) : null}
      </div>

      {horsesError || pageError ? (
        <ErrorState message={horsesError ?? pageError ?? t("dashboard.somethingWrong")} />
      ) : null}

      {!horsesLoading && horses.length === 0 ? (
        <EmptyState
          title={t("dashboard.noManageableHorsesTitle")}
          description={t("dashboard.noManageableHorsesDescription")}
        />
      ) : null}

      {selectedHorseId ? (
        <>
          <DashboardCard title={t("dashboard.overviewTitle", { horseName })} loading={dashboardLoading}>
            {!dashboardLoading ? <HorseHealthSummaryGrid snapshot={dashboard.snapshot} /> : null}
          </DashboardCard>

          <div className="grid gap-6 xl:grid-cols-2">
            <DashboardCard
              title={t("dashboard.dailyCheckTitle")}
              description={t("dashboard.dailyCheckDescription")}
              loading={dashboardLoading}
            >
              {!dashboardLoading ? (
                <DailyHealthCheckForm
                  pedigreeHorseId={selectedHorseId}
                  existingCheck={todayCheck}
                  onSaved={handleRefresh}
                />
              ) : null}
            </DashboardCard>

            <DashboardCard title={t("dashboard.alertsTitle")} loading={dashboardLoading}>
              {!dashboardLoading ? (
                <HorseHealthAlertsPanel
                  alerts={dashboard.evaluation.alerts}
                  healthScore={dashboard.evaluation.healthScore}
                />
              ) : null}
            </DashboardCard>
          </div>

          <DashboardCard title={t("dashboard.recordsTitle")} loading={dashboardLoading}>
            {!dashboardLoading ? (
              <HorseHealthRecordsPanel
                pedigreeHorseId={selectedHorseId}
                injuries={dashboard.injuries}
                farrierVisits={dashboard.farrierVisits}
                vaccinations={dashboard.vaccinations}
                onChanged={handleRefresh}
              />
            ) : null}
          </DashboardCard>
        </>
      ) : null}
    </div>
  );
}
