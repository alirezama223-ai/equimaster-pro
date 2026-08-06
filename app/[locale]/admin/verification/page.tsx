import { getTranslations } from "next-intl/server";
import AdminPageHeader from "@/app/components/admin/AdminPageHeader";
import AdminVerificationClient from "@/app/components/admin/AdminVerificationClient";
import {
  getAdminVerificationQueue,
  getVerificationAuditLog,
} from "@/app/actions/verification";

export const dynamic = "force-dynamic";

export default async function AdminVerificationPage() {
  const t = await getTranslations("verification.admin");
  const tAdmin = await getTranslations("admin");
  const [{ sellers, horses, error }, auditResult] = await Promise.all([
    getAdminVerificationQueue({ status: "pending" }),
    getVerificationAuditLog(),
  ]);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow={tAdmin("adminEyebrow")}
        title={t("title")}
        description={t("subtitle")}
      />
      <AdminVerificationClient
        initialSellers={sellers}
        initialHorses={horses}
        initialAudit={auditResult.entries}
        error={error ?? auditResult.error}
      />
    </div>
  );
}
