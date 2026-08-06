"use client";

import { useTranslations } from "next-intl";
import type { HorseVerificationStatus, SellerVerificationStatus } from "@/app/types/verification";

type Props = {
  status: SellerVerificationStatus | HorseVerificationStatus;
  className?: string;
};

export default function VerificationStatusBadge({ status, className = "" }: Props) {
  const t = useTranslations("verification.status");

  const styles: Record<string, string> = {
    unverified: "border-gray-500/30 bg-gray-500/10 text-gray-300",
    pending: "border-amber-500/30 bg-amber-500/15 text-amber-200",
    documents_submitted: "border-blue-500/30 bg-blue-500/15 text-blue-200",
    verified: "border-emerald-500/30 bg-emerald-500/15 text-emerald-200",
    rejected: "border-red-500/30 bg-red-500/15 text-red-200",
  };

  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status] ?? styles.unverified} ${className}`.trim()}
    >
      {t(status)}
    </span>
  );
}
