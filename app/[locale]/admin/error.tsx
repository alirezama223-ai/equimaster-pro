"use client";

import { useTranslations } from "next-intl";

type Props = {
  reset: () => void;
};

export default function AdminError({ reset }: Props) {
  const t = useTranslations("admin.error");

  return (
    <div className="rounded-3xl border border-red-500/30 bg-red-500/10 px-6 py-10 text-center">
      <h2 className="text-xl font-bold text-white">{t("title")}</h2>
      <p className="mt-3 text-sm text-red-200">{t("description")}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
      >
        {t("retry")}
      </button>
    </div>
  );
}
