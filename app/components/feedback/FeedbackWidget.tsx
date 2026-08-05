"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useCallback, useEffect, useState } from "react";
import FeedbackModal from "@/app/components/feedback/FeedbackModal";
import { detectBrowserName, detectOperatingSystem } from "@/app/lib/feedback/client-env";
import { loginRedirectPath } from "@/app/lib/auth/paths";

type Props = {
  isAuthenticated: boolean;
};

let mobileFeedbackOpenHandler: (() => void) | null = null;

export function openMobileFeedbackMenu() {
  mobileFeedbackOpenHandler?.();
}

function registerMobileFeedbackOpenHandler(handler: (() => void) | null) {
  mobileFeedbackOpenHandler = handler;
}

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

  const handleOpen = useCallback(() => {
    if (!isAuthenticated) {
      router.push(loginRedirectPath(pathname));
      return;
    }

    setIsOpen(true);
  }, [isAuthenticated, pathname, router]);

  useEffect(() => {
    registerMobileFeedbackOpenHandler(handleOpen);
    return () => registerMobileFeedbackOpenHandler(null);
  }, [handleOpen]);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label={t("floatingButtonAria")}
        className="glass-surface fixed z-40 hidden h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-blue-500/40 px-5 py-3.5 text-sm font-semibold text-white shadow-xl shadow-blue-900/30 transition hover:border-blue-400 hover:bg-blue-600 md:inline-flex md:bottom-[max(1.5rem,env(safe-area-inset-bottom,0px))] md:right-[max(1.5rem,env(safe-area-inset-right,0px))]"
      >
        <span aria-hidden className="text-base">
          💬
        </span>
        <span>{t("floatingButton")}</span>
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
