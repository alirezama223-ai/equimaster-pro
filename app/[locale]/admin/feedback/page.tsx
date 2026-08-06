import { getTranslations } from "next-intl/server";
import AdminFeedbackClient from "@/app/components/admin/AdminFeedbackClient";
import AdminPageHeader from "@/app/components/admin/AdminPageHeader";
import { getAdminFeedbackReportsExtended } from "@/app/actions/admin-enterprise";

export const dynamic = "force-dynamic";

export default async function AdminFeedbackPage() {
  const t = await getTranslations("admin");
  const { reports, error } = await getAdminFeedbackReportsExtended();

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow={t("adminEyebrow")}
        title={t("feedback.title")}
        description={t("feedback.subtitle")}
      />

      {error ? (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 px-6 py-8 text-red-200">
          {error}
        </div>
      ) : (
        <AdminFeedbackClient reports={reports} />
      )}
    </div>
  );
}
