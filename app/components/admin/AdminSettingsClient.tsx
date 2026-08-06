"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState, useTransition } from "react";
import { updateAdminSettings } from "@/app/actions/admin-panel";
import type { AdminMarketplaceSettings } from "@/app/types/admin-panel";

type Props = {
  settings: AdminMarketplaceSettings;
  error?: string;
};

const inputClassName =
  "w-full rounded-xl border border-white/10 bg-[#08111F] px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none";

export default function AdminSettingsClient({ settings, error }: Props) {
  const t = useTranslations("admin.settings");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState(settings);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setActionError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await updateAdminSettings(form);
      if (result.error) {
        setActionError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error || actionError ? (
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-red-200">
          {error ?? actionError}
        </div>
      ) : null}

      {saved ? (
        <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 px-6 py-4 text-emerald-200">
          {t("saved")}
        </div>
      ) : null}

      <div className="rounded-3xl border border-white/10 bg-[#111827] p-6 space-y-6">
        <label className="flex items-start gap-4">
          <input
            type="checkbox"
            checked={form.maintenance_mode}
            onChange={(event) =>
              setForm((current) => ({ ...current, maintenance_mode: event.target.checked }))
            }
            className="mt-1 h-4 w-4 rounded border-white/20 bg-[#08111F] text-blue-600 focus:ring-blue-500"
            disabled={isPending}
          />
          <span>
            <span className="block text-sm font-semibold text-white">{t("maintenanceMode")}</span>
            <span className="mt-1 block text-sm text-gray-400">{t("maintenanceModeHelp")}</span>
          </span>
        </label>

        <label className="flex items-start gap-4">
          <input
            type="checkbox"
            checked={form.require_listing_review}
            onChange={(event) =>
              setForm((current) => ({ ...current, require_listing_review: event.target.checked }))
            }
            className="mt-1 h-4 w-4 rounded border-white/20 bg-[#08111F] text-blue-600 focus:ring-blue-500"
            disabled={isPending}
          />
          <span>
            <span className="block text-sm font-semibold text-white">{t("requireListingReview")}</span>
            <span className="mt-1 block text-sm text-gray-400">{t("requireListingReviewHelp")}</span>
          </span>
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-white">{t("supportEmail")}</span>
          <input
            type="email"
            value={form.support_email}
            onChange={(event) =>
              setForm((current) => ({ ...current, support_email: event.target.value }))
            }
            className={inputClassName}
            disabled={isPending}
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-semibold text-white">{t("welcomeMessage")}</span>
          <textarea
            value={form.welcome_message}
            onChange={(event) =>
              setForm((current) => ({ ...current, welcome_message: event.target.value }))
            }
            rows={4}
            className={inputClassName}
            disabled={isPending}
            required
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
      >
        {isPending ? t("saving") : t("save")}
      </button>
    </form>
  );
}
