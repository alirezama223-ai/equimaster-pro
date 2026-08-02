"use client";

import { useTranslations } from "next-intl";
import type { HealthAlert, HealthAlertSeverity, HealthRuleId } from "@/app/types/health";

type Props = {
  alerts: HealthAlert[];
  healthScore: number;
};

const SEVERITY_STYLES: Record<HealthAlertSeverity, { badge: string; border: string }> = {
  alert: {
    badge: "bg-red-500/20 text-red-200",
    border: "border-red-500/30",
  },
  watch: {
    badge: "bg-amber-500/20 text-amber-200",
    border: "border-amber-500/30",
  },
  info: {
    badge: "bg-blue-500/20 text-blue-200",
    border: "border-blue-500/30",
  },
  positive: {
    badge: "bg-emerald-500/20 text-emerald-200",
    border: "border-emerald-500/30",
  },
};

export default function HorseHealthAlertsPanel({ alerts, healthScore }: Props) {
  const t = useTranslations("health");

  function severityLabel(severity: HealthAlertSeverity): string {
    return t(`alerts.severity.${severity}` as Parameters<typeof t>[0]);
  }

  function ruleLabel(ruleId: HealthRuleId): string {
    return t(`alerts.ruleLabels.${ruleId}` as Parameters<typeof t>[0]);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{t("alerts.title")}</h3>
          <p className="text-sm text-gray-400">{t("alerts.description")}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-center">
          <p className="text-xs uppercase tracking-[0.16em] text-gray-500">{t("alerts.healthScore")}</p>
          <p className="text-2xl font-bold text-white">{healthScore}</p>
        </div>
      </div>

      <div className="grid gap-3">
        {alerts.map((alert) => {
          const styles = SEVERITY_STYLES[alert.severity];
          return (
            <article
              key={alert.ruleId}
              className={`rounded-2xl border ${styles.border} bg-[#0f172a] p-4`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${styles.badge}`}>
                  {severityLabel(alert.severity)}
                </span>
                <span className="text-xs uppercase tracking-[0.14em] text-gray-500">
                  {ruleLabel(alert.ruleId)}
                </span>
              </div>
              <h4 className="mt-3 text-base font-semibold text-white">{alert.title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">{alert.explanation}</p>
              <p className="mt-3 text-sm text-blue-200">{alert.recommendation}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}
