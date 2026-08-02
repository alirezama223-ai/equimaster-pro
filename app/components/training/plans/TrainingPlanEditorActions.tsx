"use client";

import { useTranslations } from "next-intl";

type Props = {
  isDirty: boolean;
  isSaving: boolean;
  saveError: string | null;
  onSave: () => void;
  onCancel: () => void;
};

export default function TrainingPlanEditorActions({
  isDirty,
  isSaving,
  saveError,
  onSave,
  onCancel,
}: Props) {
  const t = useTranslations("training");
  const tCommon = useTranslations("common");

  return (
    <div className="rounded-3xl border border-white/10 bg-[#111827] p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {isDirty ? (
            <p className="text-sm font-semibold text-amber-200">{t("plans.unsavedChanges")}</p>
          ) : (
            <p className="text-sm text-gray-400">{t("plans.allChangesSaved")}</p>
          )}
          {saveError ? <p className="mt-2 text-sm text-red-200">{saveError}</p> : null}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={!isDirty || isSaving}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-300 transition hover:border-blue-500/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {tCommon("cancel")}
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!isDirty || isSaving}
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isSaving ? t("exerciseExecution.saving") : t("plans.savePlan")}
          </button>
        </div>
      </div>
    </div>
  );
}
