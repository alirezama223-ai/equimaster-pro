import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Navbar from "@/app/components/navbar/Navbar";
import AdminNav from "@/app/components/admin/AdminNav";
import AdminStatsGrid from "@/app/components/admin/AdminStatsGrid";
import { getAdminDashboardStats } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const t = await getTranslations("admin");
  const { stats, error } = await getAdminDashboardStats();

  if (!stats) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#08111F] pt-28 pb-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="rounded-3xl border border-red-500/30 bg-red-500/10 px-6 py-8 text-red-200">
              {error ?? t("dashboard.loadError")}
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#08111F] pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-6 space-y-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-blue-400">{t("brandEyebrow")}</p>
              <h1 className="mt-2 text-4xl font-black text-white">{t("dashboard.title")}</h1>
              <p className="mt-3 text-gray-400 max-w-2xl">{t("dashboard.subtitle")}</p>
            </div>
            <Link
              href="/account"
              className="inline-flex rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:border-blue-500 transition"
            >
              {t("dashboard.backToAccount")}
            </Link>
          </div>

          <AdminNav />
          <AdminStatsGrid stats={stats} />

          <div className="grid gap-5 md:grid-cols-2">
            <Link
              href="/admin/breeders?filter=pending"
              className="rounded-3xl border border-white/10 bg-[#111827] p-6 hover:border-blue-500/40 transition"
            >
              <h2 className="text-xl font-bold text-white">{t("dashboard.reviewBreedersTitle")}</h2>
              <p className="mt-2 text-gray-400">{t("dashboard.reviewBreedersSubtitle")}</p>
            </Link>
            <Link
              href="/admin/stallions?filter=pending"
              className="rounded-3xl border border-white/10 bg-[#111827] p-6 hover:border-blue-500/40 transition"
            >
              <h2 className="text-xl font-bold text-white">{t("dashboard.reviewStallionsTitle")}</h2>
              <p className="mt-2 text-gray-400">{t("dashboard.reviewStallionsSubtitle")}</p>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
