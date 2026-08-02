"use client";

import { useTranslations } from "next-intl";

type Props = {
  className?: string;
};

export default function VerifiedBadge({ className = "" }: Props) {
  const t = useTranslations("admin.verification");

  return (
    <span
      className={`inline-flex items-center rounded-full bg-blue-600 px-3 py-1 text-xs font-bold text-white shadow-lg ${className}`.trim()}
    >
      {t("badge")}
    </span>
  );
}
