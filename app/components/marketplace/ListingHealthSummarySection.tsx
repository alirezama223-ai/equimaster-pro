import { getTranslations } from "next-intl/server";
import type { PublicHealthSummarySnapshot } from "@/app/types/marketplace-public";

type Props = {
  summary: PublicHealthSummarySnapshot | null;
};

export default async function ListingHealthSummarySection({ summary }: Props) {
  const t = await getTranslations("marketplace");

  if (!summary) {
    return (
      <section className="rounded-2xl border border-white/[0.08] bg-[#111827] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] sm:p-6 lg:p-8">
        <h2 className="text-2xl font-bold">{t("healthSummary.title")}</h2>
        <p className="mt-3 text-gray-400">{t("healthSummary.empty")}</p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 sm:p-8">
      <h2 className="text-2xl font-bold">{t("healthSummary.title")}</h2>
      <p className="mt-2 text-gray-400">{t("healthSummary.subtitle")}</p>

      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric
          label={t("healthSummary.wellnessScore")}
          value={summary.readinessScore != null ? `${summary.readinessScore}/100` : "—"}
        />
        <Metric label={t("healthSummary.status")} value={summary.readinessLabel} />
        <Metric label={t("healthSummary.activeInjuries")} value={String(summary.activeInjuryCount)} />
        <Metric label={t("healthSummary.overdueVaccines")} value={String(summary.overdueVaccinationCount)} />
      </div>

      {summary.latestCheckDate ? (
        <p className="mt-4 text-sm text-gray-500">
          {t("healthSummary.latestCheck", { date: summary.latestCheckDate })}
        </p>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-lg font-bold text-white">{value}</p>
    </div>
  );
}
