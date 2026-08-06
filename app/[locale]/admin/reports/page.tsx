import { getTranslations } from "next-intl/server";
import AdminPageHeader from "@/app/components/admin/AdminPageHeader";
import AdminReportsClient from "@/app/components/admin/AdminReportsClient";
import { getAdminReportSummary } from "@/app/actions/admin-panel";

export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const t = await getTranslations("admin");
  const { report, error } = await getAdminReportSummary();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow={t("adminEyebrow")}
        title={t("reports.title")}
        description={t("reports.subtitle")}
      />

      {error || !report ? (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 px-6 py-8 text-red-200">
          {error ?? t("reports.loadError")}
        </div>
      ) : (
        <AdminReportsClient report={report} />
      )}
    </div>
  );
}
