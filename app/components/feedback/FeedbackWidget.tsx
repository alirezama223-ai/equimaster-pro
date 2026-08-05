"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useEffect, useState } from "react";
import FeedbackModal from "@/app/components/feedback/FeedbackModal";
import { detectBrowserName, detectOperatingSystem } from "@/app/lib/feedback/client-env";
import { loginRedirectPath } from "@/app/lib/auth/paths";
import { SAFE_AREA_PADDING_STYLE } from "@/app/lib/browser-compat";

type Props = {
  isAuthenticated: boolean;
};

export default function FeedbackWidget({ isAuthenticated }: Props) {
  const t = useTranslations("feedback");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  function handleOpen() {
    if (!isAuthenticated) {
      router.push(loginRedirectPath(pathname));
      return;
    }

    setIsOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label={t("floatingButtonAria")}
        style={SAFE_AREA_PADDING_STYLE}
        className="glass-surface fixed bottom-4 right-4 z-40 inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-blue-500/40 px-3 text-sm font-semibold text-white shadow-xl shadow-blue-900/30 transition hover:border-blue-400 hover:bg-blue-600 sm:bottom-6 sm:right-6 sm:px-5 sm:py-3.5"
      >
        <span aria-hidden className="text-base">
          💬
        </span>
        <span className="hidden min-[360px]:inline">{t("floatingButton")}</span>
      </button>

      {isOpen ? (
        <FeedbackModal
          pagePath={pathname}
          browser={detectBrowserName()}
          os={detectOperatingSystem()}
          locale={locale}
          onClose={() => setIsOpen(false)}
        />
      ) : null}
    </>
  );
}
