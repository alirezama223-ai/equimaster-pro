import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import AdminAnalyticsGrid from "@/app/components/admin/AdminAnalyticsGrid";
import AdminPageHeader from "@/app/components/admin/AdminPageHeader";
import { getAdminAnalyticsStats } from "@/app/actions/admin-panel";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const t = await getTranslations("admin");
  const { stats, error } = await getAdminAnalyticsStats();

  if (!stats) {
    return (
      <div className="rounded-3xl border border-red-500/30 bg-red-500/10 px-6 py-8 text-red-200">
        {error ?? t("dashboard.loadError")}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow={t("brandEyebrow")}
        title={t("dashboard.title")}
        description={t("dashboard.subtitle")}
      />

      <AdminAnalyticsGrid stats={stats} />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Link
          href="/admin/users"
          className="rounded-3xl border border-white/10 bg-[#111827] p-6 transition hover:border-blue-500/40"
        >
          <h2 className="text-xl font-bold text-white">{t("dashboard.quickLinks.usersTitle")}</h2>
          <p className="mt-2 text-gray-400">{t("dashboard.quickLinks.usersSubtitle")}</p>
        </Link>
        <Link
          href="/admin/listings?filter=draft"
          className="rounded-3xl border border-white/10 bg-[#111827] p-6 transition hover:border-blue-500/40"
        >
          <h2 className="text-xl font-bold text-white">{t("dashboard.quickLinks.listingsTitle")}</h2>
          <p className="mt-2 text-gray-400">{t("dashboard.quickLinks.listingsSubtitle")}</p>
        </Link>
        <Link
          href="/admin/sellers"
          className="rounded-3xl border border-white/10 bg-[#111827] p-6 transition hover:border-blue-500/40"
        >
          <h2 className="text-xl font-bold text-white">{t("dashboard.quickLinks.sellersTitle")}</h2>
          <p className="mt-2 text-gray-400">{t("dashboard.quickLinks.sellersSubtitle")}</p>
        </Link>
        <Link
          href="/admin/breeders?filter=pending"
          className="rounded-3xl border border-white/10 bg-[#111827] p-6 transition hover:border-blue-500/40"
        >
          <h2 className="text-xl font-bold text-white">{t("dashboard.reviewBreedersTitle")}</h2>
          <p className="mt-2 text-gray-400">{t("dashboard.reviewBreedersSubtitle")}</p>
        </Link>
        <Link
          href="/admin/stallions?filter=pending"
          className="rounded-3xl border border-white/10 bg-[#111827] p-6 transition hover:border-blue-500/40"
        >
          <h2 className="text-xl font-bold text-white">{t("dashboard.reviewStallionsTitle")}</h2>
          <p className="mt-2 text-gray-400">{t("dashboard.reviewStallionsSubtitle")}</p>
        </Link>
        <Link
          href="/admin/reports"
          className="rounded-3xl border border-white/10 bg-[#111827] p-6 transition hover:border-blue-500/40"
        >
          <h2 className="text-xl font-bold text-white">{t("dashboard.quickLinks.reportsTitle")}</h2>
          <p className="mt-2 text-gray-400">{t("dashboard.quickLinks.reportsSubtitle")}</p>
        </Link>
      </div>
    </div>
  );
}
