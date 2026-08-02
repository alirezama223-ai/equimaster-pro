"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { localeLabels, type AppLocale } from "@/i18n/routing";

export default function LocaleSwitcher() {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("common");

  return (
    <label className="inline-flex items-center gap-2 text-sm text-gray-300">
      <span className="sr-only">{t("selectLanguage")}</span>
      <select
        value={locale}
        onChange={(event) => {
          router.replace(pathname, { locale: event.target.value as AppLocale });
        }}
        className="rounded-lg border border-white/15 bg-[#08111F] px-2 py-1.5 text-sm text-white outline-none focus:border-blue-500"
        aria-label={t("selectLanguage")}
      >
        {(Object.entries(localeLabels) as [AppLocale, string][]).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );
}
