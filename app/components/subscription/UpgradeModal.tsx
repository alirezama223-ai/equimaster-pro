"use client";

import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

type Props = {
  open: boolean;
  used: number;
  limit: number | null;
  onClose: () => void;
};

export default function UpgradeModal({ open, used, limit, onClose }: Props) {
  const t = useTranslations("subscription.upgradeModal");

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4">
      <div
        className="w-full max-w-lg rounded-3xl border border-blue-500/30 bg-[#111827] p-6 shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-modal-title"
      >
        <h2 id="upgrade-modal-title" className="text-2xl font-black text-white">
          {t("title")}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-300">{t("description")}</p>
        {limit != null ? (
          <p className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            {t("currentUsage", { used, limit })}
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/account/subscription"
            onClick={onClose}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            {t("cta")}
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-white/10 px-4 py-3 text-sm font-semibold text-gray-200 transition hover:border-white/20"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
