"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useEffect, useId, useState } from "react";
import { createPortal } from "react-dom";
import NotificationBell from "@/app/components/events/NotificationBell";
import LogoutButton from "@/app/components/auth/LogoutButton";
import LocaleSwitcher from "@/app/components/navbar/LocaleSwitcher";
import ProtectedLink from "@/app/components/auth/ProtectedLink";
import { openMobileFeedbackMenu } from "@/app/components/feedback/FeedbackWidget";
import { setMobileDrawerOpen } from "@/app/components/navbar/mobileDrawerState";
import { useNavbarBrandLabels } from "@/app/components/navbar/useNavbarBrandLabels";
import { FULL_NAV_LINKS, navLinkClassName } from "@/app/components/navbar/navLinks";
import { useNavbarAuthUser } from "@/app/components/navbar/useNavbarAuthUser";

export default function NavbarMobileMenu() {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const tFeedback = useTranslations("feedback");
  const { brandShort } = useNavbarBrandLabels();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuId = useId();
  const { user, isAdmin, isLoading } = useNavbarAuthUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setMobileDrawerOpen(open);

    if (open) {
      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        setMobileDrawerOpen(false);
        document.body.style.overflow = previousOverflow;
      };
    }

    return () => {
      setMobileDrawerOpen(false);
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const actionLinkClass =
    "flex min-h-11 items-center rounded-xl px-3 py-2.5 text-sm font-semibold text-white transition";

  function closeMenu() {
    setOpen(false);
  }

  const drawer =
    open && mounted ? (
      <div
        id={menuId}
        role="dialog"
        aria-modal="true"
        aria-label={t("menu")}
        className="fixed inset-0 z-[200] flex h-[100dvh] w-screen flex-col overflow-hidden bg-slate-950 text-white md:hidden"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-3 pb-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))]">
          <span className="text-base font-black text-white">{brandShort}</span>
          <button
            type="button"
            aria-label={t("closeMenu")}
            onClick={closeMenu}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-white transition hover:bg-slate-800"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="scroll-touch min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
          <nav className="grid gap-1" aria-label={t("primaryNav")}>
            {FULL_NAV_LINKS.map((link) => (
              <ProtectedLink
                key={`mobile-${link.href}-${link.labelKey}`}
                href={link.href}
                role="menuitem"
                onClick={closeMenu}
                className={`min-h-11 px-3 py-2.5 text-sm font-medium text-white ${navLinkClassName(link, "flex items-center rounded-xl transition")}`}
              >
                {t(link.labelKey)}
              </ProtectedLink>
            ))}
          </nav>

          <div
            className="mt-3 rounded-xl border border-slate-800 bg-[#08111F] p-3"
            role="group"
            aria-label={tCommon("language")}
          >
            <p className="mb-2 text-sm font-medium text-white">{tCommon("language")}</p>
            <div className="[&_label]:w-full [&_label]:text-slate-300 [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-white/15 [&_select]:bg-[#08111F] [&_select]:px-2 [&_select]:py-1.5 [&_select]:text-sm [&_select]:text-white [&_select]:outline-none [&_select]:focus:border-blue-500">
              <LocaleSwitcher />
            </div>
          </div>

          <div className="my-3 border-t border-slate-800" aria-hidden="true" />

          <div className="grid gap-2">
            <ProtectedLink
              href="/sell"
              role="menuitem"
              onClick={closeMenu}
              className={`${actionLinkClass} bg-blue-600 hover:bg-blue-500`}
            >
              {t("sellAHorse")}
            </ProtectedLink>

            {isLoading ? (
              <div className="h-11 animate-pulse rounded-xl bg-slate-800" aria-hidden="true" />
            ) : null}

            {!isLoading && !user ? (
              <>
                <Link
                  href="/login"
                  role="menuitem"
                  onClick={closeMenu}
                  className={`${actionLinkClass} bg-slate-900 hover:bg-slate-800`}
                >
                  {t("login")}
                </Link>
                <Link
                  href="/signup"
                  role="menuitem"
                  onClick={closeMenu}
                  className={`${actionLinkClass} border border-slate-800 hover:bg-slate-900`}
                >
                  {t("signup")}
                </Link>
              </>
            ) : null}

            {!isLoading && user ? (
              <>
                {isAdmin ? (
                  <ProtectedLink
                    href="/admin"
                    role="menuitem"
                    onClick={closeMenu}
                    className={`${actionLinkClass} border border-blue-500/40 text-blue-200 hover:bg-blue-500/10`}
                  >
                    {t("admin")}
                  </ProtectedLink>
                ) : null}
                <ProtectedLink
                  href="/account"
                  role="menuitem"
                  onClick={closeMenu}
                  className={`${actionLinkClass} border border-slate-800 hover:bg-slate-900`}
                >
                  {t("account")}
                </ProtectedLink>
                <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                  <LogoutButton variant="menu" />
                </div>
              </>
            ) : null}

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                closeMenu();
                openMobileFeedbackMenu();
              }}
              className={`${actionLinkClass} border border-blue-500/40 text-blue-100 hover:bg-blue-500/10`}
            >
              <span aria-hidden className="mr-2">
                💬
              </span>
              {tFeedback("floatingButton")}
            </button>

            <div className="flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 py-2">
              <span className="text-sm text-slate-300">{t("notifications")}</span>
              <NotificationBell />
            </div>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="dialog"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white transition hover:bg-white/10"
      >
        <span className="sr-only">{open ? t("closeMenu") : t("openMenu")}</span>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          {open ? (
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          ) : (
            <>
              <path strokeLinecap="round" d="M4 7h16" />
              <path strokeLinecap="round" d="M4 12h16" />
              <path strokeLinecap="round" d="M4 17h16" />
            </>
          )}
        </svg>
      </button>

      {mounted && drawer ? createPortal(drawer, document.body) : null}
    </div>
  );
}
