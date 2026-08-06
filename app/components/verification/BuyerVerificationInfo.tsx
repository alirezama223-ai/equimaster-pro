import { getTranslations } from "next-intl/server";
import VerifiedBadge from "@/app/components/verification/VerifiedBadge";

type Props = {
  sellerVerified?: boolean;
  horseVerified?: boolean;
  sellerVerifiedAt?: string | null;
  horseVerifiedAt?: string | null;
};

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return null;
  return new Date(value).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BuyerVerificationInfo({
  sellerVerified = false,
  horseVerified = false,
  sellerVerifiedAt,
  horseVerifiedAt,
}: Props) {
  const t = await getTranslations("verification.buyer");
  const locale = "en";

  if (!sellerVerified && !horseVerified) {
    return null;
  }

  return (
    <section className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5 sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-300">
        {t("title")}
      </p>

      <div className="mt-4 space-y-4">
        {sellerVerified ? (
          <div className="space-y-2">
            <VerifiedBadge label="seller" />
            <p className="text-sm text-gray-300">{t("sellerVerified")}</p>
            {sellerVerifiedAt ? (
              <p className="text-xs text-gray-500">
                {t("verifiedOn", { date: formatDate(sellerVerifiedAt, locale) ?? "" })}
              </p>
            ) : null}
            <p className="text-xs font-medium text-blue-300">{t("verifiedByEquiMaster")}</p>
          </div>
        ) : null}

        {horseVerified ? (
          <div className="space-y-2">
            <VerifiedBadge label="horse" />
            <p className="text-sm text-gray-300">{t("horseVerified")}</p>
            {horseVerifiedAt ? (
              <p className="text-xs text-gray-500">
                {t("verifiedOn", { date: formatDate(horseVerifiedAt, locale) ?? "" })}
              </p>
            ) : null}
            <p className="text-xs font-medium text-blue-300">{t("verifiedByEquiMaster")}</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
