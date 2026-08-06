"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState, useTransition } from "react";
import { updateAdminSettings } from "@/app/actions/admin-panel";
import type { AdminMarketplaceSettings } from "@/app/types/admin-panel";
import {
  ADMIN_ERROR_CLASS,
  ADMIN_INPUT_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
  ADMIN_SUCCESS_CLASS,
} from "@/app/components/admin/admin-styles";

type Props = {
  settings: AdminMarketplaceSettings;
  error?: string;
};

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
      {(error || actionError) ? <div className={ADMIN_ERROR_CLASS}>{error ?? actionError}</div> : null}
      {saved ? <div className={ADMIN_SUCCESS_CLASS}>{t("saved")}</div> : null}

      <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 space-y-5">
        <h3 className="text-lg font-bold text-white">{t("sections.marketplace")}</h3>
        <label className="flex items-start gap-4">
          <input type="checkbox" checked={form.maintenance_mode} onChange={(event) => setForm((current) => ({ ...current, maintenance_mode: event.target.checked }))} className="mt-1 h-4 w-4" disabled={isPending} />
          <span><span className="block text-sm font-semibold text-white">{t("maintenanceMode")}</span><span className="mt-1 block text-sm text-gray-400">{t("maintenanceModeHelp")}</span></span>
        </label>
        <label className="flex items-start gap-4">
          <input type="checkbox" checked={form.require_listing_review} onChange={(event) => setForm((current) => ({ ...current, require_listing_review: event.target.checked }))} className="mt-1 h-4 w-4" disabled={isPending} />
          <span><span className="block text-sm font-semibold text-white">{t("requireListingReview")}</span><span className="mt-1 block text-sm text-gray-400">{t("requireListingReviewHelp")}</span></span>
        </label>
        <label className="block space-y-2"><span className="text-sm font-semibold text-white">{t("supportEmail")}</span><input type="email" value={form.support_email} onChange={(event) => setForm((current) => ({ ...current, support_email: event.target.value }))} className={ADMIN_INPUT_CLASS} required disabled={isPending} /></label>
        <label className="block space-y-2"><span className="text-sm font-semibold text-white">{t("welcomeMessage")}</span><textarea value={form.welcome_message} onChange={(event) => setForm((current) => ({ ...current, welcome_message: event.target.value }))} rows={3} className={ADMIN_INPUT_CLASS} required disabled={isPending} /></label>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 space-y-5">
        <h3 className="text-lg font-bold text-white">{t("sections.homepage")}</h3>
        <label className="block space-y-2"><span className="text-sm font-semibold text-white">{t("heroTitle")}</span><input type="text" value={form.homepage_hero.title} onChange={(event) => setForm((current) => ({ ...current, homepage_hero: { ...current.homepage_hero, title: event.target.value } }))} className={ADMIN_INPUT_CLASS} disabled={isPending} /></label>
        <label className="block space-y-2"><span className="text-sm font-semibold text-white">{t("heroSubtitle")}</span><textarea value={form.homepage_hero.subtitle} onChange={(event) => setForm((current) => ({ ...current, homepage_hero: { ...current.homepage_hero, subtitle: event.target.value } }))} rows={3} className={ADMIN_INPUT_CLASS} disabled={isPending} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2"><span className="text-sm font-semibold text-white">{t("heroCtaLabel")}</span><input type="text" value={form.homepage_hero.cta_label} onChange={(event) => setForm((current) => ({ ...current, homepage_hero: { ...current.homepage_hero, cta_label: event.target.value } }))} className={ADMIN_INPUT_CLASS} disabled={isPending} /></label>
          <label className="block space-y-2"><span className="text-sm font-semibold text-white">{t("heroCtaHref")}</span><input type="text" value={form.homepage_hero.cta_href} onChange={(event) => setForm((current) => ({ ...current, homepage_hero: { ...current.homepage_hero, cta_href: event.target.value } }))} className={ADMIN_INPUT_CLASS} disabled={isPending} /></label>
        </div>
        <label className="block space-y-2"><span className="text-sm font-semibold text-white">{t("featuredBreeds")}</span><input type="text" value={form.featured_breeds.join(", ")} onChange={(event) => setForm((current) => ({ ...current, featured_breeds: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))} className={ADMIN_INPUT_CLASS} disabled={isPending} placeholder={t("featuredBreedsPlaceholder")} /></label>
        <label className="block space-y-2"><span className="text-sm font-semibold text-white">{t("featuredStallions")}</span><input type="text" value={form.featured_stallions.join(", ")} onChange={(event) => setForm((current) => ({ ...current, featured_stallions: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) }))} className={ADMIN_INPUT_CLASS} disabled={isPending} placeholder={t("featuredStallionsPlaceholder")} /></label>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 space-y-4">
        <h3 className="text-lg font-bold text-white">{t("sections.featureFlags")}</h3>
        {Object.entries(form.feature_flags).map(([key, value]) => (
          <label key={key} className="flex items-start gap-4">
            <input type="checkbox" checked={value} onChange={(event) => setForm((current) => ({ ...current, feature_flags: { ...current.feature_flags, [key]: event.target.checked } }))} className="mt-1 h-4 w-4" disabled={isPending} />
            <span className="text-sm text-white">{t(`featureFlags.${key}`)}</span>
          </label>
        ))}
      </section>

      <button type="submit" disabled={isPending} className={ADMIN_PRIMARY_BUTTON_CLASS}>
        {isPending ? t("saving") : t("save")}
      </button>
    </form>
  );
}
