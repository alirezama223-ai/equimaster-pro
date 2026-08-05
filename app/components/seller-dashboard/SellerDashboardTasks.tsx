"use client";

import { memo, useMemo } from "react";
import { useTranslations } from "next-intl";
import DashboardCard from "@/app/components/shared/DashboardCard";
import type { SellerTaskItem } from "@/app/components/seller-dashboard/seller-dashboard-utils";

type Props = {
  tasks: SellerTaskItem[];
};

function SellerDashboardTasks({ tasks }: Props) {
  const t = useTranslations("dashboard");
  const completedCount = useMemo(
    () => tasks.filter((task) => task.completed).length,
    [tasks]
  );
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <DashboardCard
      eyebrow={t("tasks.eyebrow")}
      title={t("tasks.title")}
      description={t("tasks.description")}
    >
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="text-gray-400">{t("tasks.progress")}</span>
          <span className="font-semibold text-white">
            {t("tasks.complete", { completed: completedCount, total: tasks.length })}
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <ul className="space-y-3">
        {tasks.map((task) => (
          <li
            key={task.key}
            className="flex min-h-11 items-center gap-3 rounded-xl border border-white/[0.06] bg-[#08111F]/60 px-4 py-3"
          >
            <span
              aria-hidden="true"
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                task.completed
                  ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
                  : "border-white/10 bg-white/5 text-gray-500"
              }`}
            >
              {task.completed ? "✓" : ""}
            </span>
            <span className={`text-sm ${task.completed ? "text-gray-400 line-through" : "text-white"}`}>
              {task.label}
            </span>
          </li>
        ))}
      </ul>
    </DashboardCard>
  );
}

export default memo(SellerDashboardTasks);
