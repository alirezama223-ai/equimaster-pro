"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import type { TrainingPlanListItem } from "@/app/types/training-plans";

type Props = {
  plan: TrainingPlanListItem;
  isOpen: boolean;
  isDeleting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeleteTrainingPlanDialog({
  plan,
  isOpen,
  isDeleting,
  error,
  onClose,
  onConfirm,
}: Props) {
  const t = useTranslations("training");
  const tCommon = useTranslations("common");

  function assignedHorseCountLabel(count: number): string {
    if (count === 0) return t("assignedHorses.none");
    if (count === 1) return t("assignedHorses.one");
    return t("assignedHorses.many", { count });
  }

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isDeleting) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={isDeleting ? undefined : onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#111C2E] shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-plan-title"
      >
        <div className="border-b border-white/10 p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400">{t("plans.deletePlanEyebrow")}</p>
          <h2 id="delete-plan-title" className="mt-2 text-2xl font-bold text-white sm:text-3xl">
            {t("plans.deletePlanTitle", { name: plan.name })}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-400">{t("plans.deletePlanDescription")}</p>
          {plan.assignedHorseCount > 0 ? (
            <p className="mt-3 text-sm text-amber-200">
              {t("plans.deletePlanAssignedWarning", {
                assigned: assignedHorseCountLabel(plan.assignedHorseCount),
              })}
            </p>
          ) : null}
          {error ? (
            <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/5 px-4 py-3">
              <p className="text-sm text-red-200">{error}</p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-end gap-2 p-4 sm:px-8 sm:py-5">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:border-blue-500/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {tCommon("cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center justify-center rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200 transition hover:border-red-500/60 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isDeleting ? t("plans.deleting") : t("plans.deletePlanButton")}
          </button>
        </div>
      </div>
    </div>
  );
}
