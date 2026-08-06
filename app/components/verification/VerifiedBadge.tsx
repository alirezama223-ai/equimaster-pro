"use client";

import { useTranslations } from "next-intl";

type Props = {
  className?: string;
  compact?: boolean;
  label?: "seller" | "horse" | "generic";
};

export default function VerifiedBadge({ className = "", compact = false, label = "generic" }: Props) {
  const t = useTranslations("verification");

  const text =
    label === "seller"
      ? t("badge.seller")
      : label === "horse"
        ? t("badge.horse")
        : t("badge.generic");

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full bg-blue-600 font-bold text-white shadow-lg ${
        compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-xs"
      } ${className}`.trim()}
      title={t("badge.verifiedBy")}
    >
      <span aria-hidden="true">✓</span>
      <span>{text}</span>
    </span>
  );
}
