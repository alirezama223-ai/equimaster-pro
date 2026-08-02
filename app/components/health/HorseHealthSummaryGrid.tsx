"use client";

import { useTranslations } from "next-intl";
import type { HorseHealthSnapshot } from "@/app/types/health";
import { todayIsoDate } from "@/app/lib/health/format";

type Props = {
  snapshot: HorseHealthSnapshot;
};

export default function HorseHealthSummaryGrid({ snapshot }: Props) {
  const t = useTranslations("health");
  const today = todayIsoDate();
  const checkedToday = snapshot.latestCheck?.checkDate === today;

  const cards = [
    {
      label: t("summary.todaysCheck"),
      value: checkedToday ? t("summary.logged") : t("summary.pending"),
      detail: snapshot.latestCheck
        ? t("summary.lastCheck", { dateLabel: snapshot.latestCheck.checkDateLabel })
        : t("summary.noChecksYet"),
    },
    {
      label: t("summary.activeInjuries"),
      value: String(snapshot.activeInjuries.length),
      detail:
        snapshot.activeInjuries.length > 0
          ? snapshot.activeInjuries.map((item) => item.bodyArea).join(", ")
          : t("summary.noneRecorded"),
    },
    {
      label: t("summary.farrier"),
      value: snapshot.latestFarrierVisit?.nextDueDateLabel ?? t("summary.notSet"),
      detail: snapshot.latestFarrierVisit
        ? t("summary.lastVisit", { dateLabel: snapshot.latestFarrierVisit.visitDateLabel })
        : t("summary.noVisitsLogged"),
    },
    {
      label: t("summary.overdueVaccines"),
      value: String(snapshot.overdueVaccinations.length),
      detail:
        snapshot.overdueVaccinations.length > 0
          ? snapshot.overdueVaccinations.map((item) => item.vaccineName).join(", ")
          : t("summary.upToDate"),
    },
    {
      label: t("summary.activeMedications"),
      value: String(snapshot.activeMedications.length),
      detail:
        snapshot.activeMedications.length > 0
          ? snapshot.activeMedications.map((item) => item.medicationName).join(", ")
          : t("summary.noneActive"),
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-white/10 bg-[#111827] p-4"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500">
            {card.label}
          </p>
          <p className="mt-2 text-2xl font-bold text-white">{card.value}</p>
          <p className="mt-2 text-sm text-gray-400 line-clamp-2">{card.detail}</p>
        </div>
      ))}
    </div>
  );
}
