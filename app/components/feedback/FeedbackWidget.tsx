"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useCallback, useEffect, useState } from "react";
import FeedbackModal from "@/app/components/feedback/FeedbackModal";
import { detectBrowserName, detectOperatingSystem } from "@/app/lib/feedback/client-env";
import { loginRedirectPath } from "@/app/lib/auth/paths";
import { subscribeMobileDrawerOpen } from "@/app/components/navbar/mobileDrawerState";

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

function useHomeHeroVisible() {
  const pathname = usePathname();
  const [heroVisible, setHeroVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("home-hero");
    if (!hero) {
      setHeroVisible(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setHeroVisible(entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "0px 0px -1px 0px" }
    );

    observer.observe(hero);
    return () => observer.disconnect();
  }, [pathname]);

  return heroVisible;
}

function useMobileDrawerOpen() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => subscribeMobileDrawerOpen(setDrawerOpen), []);

  return drawerOpen;
}

export default function FeedbackWidget({ isAuthenticated }: Props) {
  const t = useTranslations("feedback");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const heroVisible = useHomeHeroVisible();
  const drawerOpen = useMobileDrawerOpen();
  const hideFloatingOnMobile = heroVisible || drawerOpen;

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
        className={`glass-surface fixed z-40 inline-flex h-11 w-11 min-w-11 items-center justify-center gap-2 rounded-full border border-blue-500/40 text-sm font-semibold text-white shadow-xl shadow-blue-900/30 transition hover:border-blue-400 hover:bg-blue-600 max-md:bottom-[calc(20px+env(safe-area-inset-bottom,0px))] max-md:right-4 md:bottom-[max(1.5rem,env(safe-area-inset-bottom,0px))] md:right-[max(1.5rem,env(safe-area-inset-right,0px))] md:h-auto md:w-auto md:opacity-100 md:pointer-events-auto md:translate-y-0 md:px-5 md:py-3.5 ${hideFloatingOnMobile ? "max-md:hidden" : "max-md:inline-flex"}`}
      >
        <span aria-hidden className="text-base">
          💬
        </span>
        <span className="hidden md:inline">{t("floatingButton")}</span>
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
