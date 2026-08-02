"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createTrainingPlanAction } from "@/app/actions/training-plans";

export default function TrainingPlanCreateForm() {
  const t = useTranslations("training");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createTrainingPlanAction({
        name,
        description: description.trim() || null,
        startDate: startDate || null,
      });

      if (result.error || !result.planId) {
        setError(result.error ?? t("plans.createError"));
        return;
      }

      router.push(`/training/plans/${result.planId}`);
    });
  }

  return (
    <div className="space-y-8">
      <header className="rounded-3xl border border-white/10 bg-[#111827] p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-blue-400">{t("plans.createEyebrow")}</p>
            <h1 className="mt-2 text-4xl font-black text-white sm:text-5xl">{t("plans.createTitle")}</h1>
            <p className="mt-3 max-w-3xl text-gray-400">{t("plans.createDescription")}</p>
          </div>

          <Link
            href="/training/plans"
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-gray-300 transition hover:border-blue-500/30 hover:text-white"
          >
            {t("plans.backToPlans")}
          </Link>
        </div>
      </header>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-white/10 bg-[#111827] p-6 sm:p-8"
      >
        <div className="space-y-6">
          <label className="block">
            <span className="text-sm font-semibold text-white">{t("plans.planName")}</span>
            <input
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("plans.planNamePlaceholder")}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-white">{t("plans.description")}</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={4}
              placeholder={t("plans.descriptionPlaceholder")}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </label>

          <label className="block max-w-sm">
            <span className="text-sm font-semibold text-white">{t("plans.startDate")}</span>
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-3 text-sm text-white focus:border-blue-500/50 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </label>

          {error ? <p className="text-sm text-red-200">{error}</p> : null}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isPending || !name.trim()}
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isPending ? t("plans.creating") : t("plans.createPlanButton")}
          </button>
          <Link
            href="/training/plans"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 px-6 py-3 text-sm font-medium text-gray-300 transition hover:border-blue-500/30 hover:text-white"
          >
            {tCommon("cancel")}
          </Link>
        </div>
      </form>
    </div>
  );
}
