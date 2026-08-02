"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteTrainingPlanAction } from "@/app/actions/training-plans";
import DeleteTrainingPlanDialog from "@/app/components/training/plans/DeleteTrainingPlanDialog";
import { trainingPlanStatusClassName } from "@/app/lib/training/plans/format";
import type { TrainingPlanListItem, TrainingPlanStatus } from "@/app/types/training-plans";

type Props = {
  plan: TrainingPlanListItem;
  onDeleted: (planId: string) => void;
};

function PlanMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#08111F] p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-gray-500">{label}</p>
      <p className="mt-2 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

export default function PlanCard({ plan, onDeleted }: Props) {
  const t = useTranslations("training");
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, startDeleteTransition] = useTransition();

  function planStatusLabel(status: TrainingPlanStatus): string {
    return t(`planStatus.${status}` as Parameters<typeof t>[0]);
  }

  function assignedHorseCountLabel(count: number): string {
    if (count === 0) return t("assignedHorses.none");
    if (count === 1) return t("assignedHorses.one");
    return t("assignedHorses.many", { count });
  }

  function openDeleteDialog() {
    setDeleteError(null);
    setDialogOpen(true);
  }

  function closeDeleteDialog() {
    if (isDeleting) return;
    setDialogOpen(false);
    setDeleteError(null);
  }

  function handleConfirmDelete() {
    setDeleteError(null);
    startDeleteTransition(async () => {
      const result = await deleteTrainingPlanAction(plan.id);
      if (result.error) {
        setDeleteError(result.error);
        return;
      }

      setDialogOpen(false);
      onDeleted(plan.id);
      router.refresh();
    });
  }

  return (
    <>
      <article className="flex h-full flex-col rounded-3xl border border-white/10 bg-[#111827] p-5 sm:p-6 transition hover:border-blue-500/30">
        <Link href={`/training/plans/${plan.id}`} className="block min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.16em] text-blue-400">{t("plans.trainingPlan")}</p>
              <h3 className="mt-2 truncate text-xl font-bold text-white">{plan.name}</h3>
            </div>
            <span
              className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${trainingPlanStatusClassName(plan.status)}`}
            >
              {planStatusLabel(plan.status)}
            </span>
          </div>

          {plan.description ? (
            <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-gray-400">{plan.description}</p>
          ) : null}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <PlanMetric label={t("plans.duration")} value={plan.durationLabel} />
            <PlanMetric
              label={t("plans.assignedHorses")}
              value={assignedHorseCountLabel(plan.assignedHorseCount)}
            />
          </div>
        </Link>

        <div className="mt-5 border-t border-white/10 pt-4">
          <button
            type="button"
            onClick={openDeleteDialog}
            className="inline-flex w-full items-center justify-center rounded-xl border border-red-500/40 px-4 py-2.5 text-sm font-semibold text-red-200 transition hover:border-red-500/60 hover:bg-red-500/10 sm:w-auto"
          >
            {t("plans.delete")}
          </button>
        </div>
      </article>

      <DeleteTrainingPlanDialog
        plan={plan}
        isOpen={dialogOpen}
        isDeleting={isDeleting}
        error={deleteError}
        onClose={closeDeleteDialog}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
