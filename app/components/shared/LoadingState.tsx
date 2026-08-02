"use client";

import { useTranslations } from "next-intl";

type Props = {
  message?: string;
  className?: string;
};

export default function LoadingState({ message, className = "" }: Props) {
  const t = useTranslations("common");

  return (
    <div className={`py-6 text-sm text-gray-400 ${className}`} aria-busy="true">
      {message ?? t("loading")}
    </div>
  );
}
