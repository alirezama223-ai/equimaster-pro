import { getTranslations } from "next-intl/server";
import type {
  PublicTrainingSummarySnapshot,
} from "@/app/types/marketplace-public";

type Props = {
  summary: PublicTrainingSummarySnapshot | null;
};

export default async function ListingTrainingSummarySection({ summary }: Props) {
  const t = await getTranslations("marketplace");

  if (!summary || summary.totalSessions === 0) {
    return (
      <section className="rounded-2xl border border-white/[0.08] bg-[#111827] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] sm:p-6 lg:p-8">
        <h2 className="text-2xl font-bold">{t("trainingSummary.title")}</h2>
        <p className="mt-3 text-gray-400">{t("trainingSummary.empty")}</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[#111827] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.2)] sm:p-6 lg:p-8">
      <h2 className="text-2xl font-bold">{t("trainingSummary.title")}</h2>
      <p className="mt-2 text-gray-400">{t("trainingSummary.subtitle")}</p>

      <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric label={t("trainingSummary.sessions")} value={String(summary.totalSessions)} />
        <Metric label={t("trainingSummary.completed")} value={summary.completionRateLabel} />
        <Metric
          label={t("trainingSummary.avgRating")}
          value={summary.averageRating != null ? summary.averageRating.toFixed(1) : "—"}
        />
        <Metric
          label={t("trainingSummary.currentStreak")}
          value={t("trainingSummary.streakDays", { days: summary.currentTrainingStreak })}
        />
      </div>

      {summary.lastSessionDateLabel ? (
        <p className="mt-4 text-sm text-gray-500">
          {t("trainingSummary.lastSession", { date: summary.lastSessionDateLabel })}
        </p>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-white">{value}</p>
    </div>
  );
}
