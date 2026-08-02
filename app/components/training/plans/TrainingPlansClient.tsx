"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getTrainingPlans } from "@/app/actions/training-plans";
import TrainingEmptyState from "@/app/components/training/TrainingEmptyState";
import TrainingErrorState from "@/app/components/training/TrainingErrorState";
import PlanCard from "@/app/components/training/plans/PlanCard";
import TrainingPlansHeader from "@/app/components/training/plans/TrainingPlansHeader";
import type { TrainingPlanListItem } from "@/app/types/training-plans";

export default function TrainingPlansClient() {
  const t = useTranslations("training");
  const router = useRouter();
  const [plans, setPlans] = useState<TrainingPlanListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPlans() {
      setLoading(true);
      setError(null);

      const response = await getTrainingPlans();
      if (cancelled) return;

      setPlans(response.plans);
      setError(response.error ?? null);
      setLoading(false);
    }

    void loadPlans();

    return () => {
      cancelled = true;
    };
  }, []);

  function handlePlanDeleted(planId: string) {
    setPlans((current) => current.filter((plan) => plan.id !== planId));
    router.refresh();
  }

  return (
    <div className="space-y-8">
      <TrainingPlansHeader />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">{t("plans.yourPlans")}</h2>
          <p className="mt-1 text-sm text-gray-400">
            {loading ? t("plans.loadingPlans") : t("plans.planCount", { count: plans.length })}
          </p>
        </div>

        <Link
          href="/training/plans/new"
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          {t("plans.createPlan")}
        </Link>
      </div>

      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-56 animate-pulse rounded-3xl border border-white/10 bg-[#111827]"
              aria-hidden="true"
            />
          ))}
        </div>
      ) : error ? (
        <TrainingErrorState message={error} />
      ) : plans.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onDeleted={handlePlanDeleted} />
          ))}
        </div>
      ) : (
        <TrainingEmptyState
          title={t("plans.emptyTitle")}
          description={t("plans.emptyDescription")}
        />
      )}
    </div>
  );
}
