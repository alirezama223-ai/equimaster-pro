"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useEffect, useId, useState } from "react";
import NotificationBell from "@/app/components/events/NotificationBell";
import LogoutButton from "@/app/components/auth/LogoutButton";
import LocaleSwitcher from "@/app/components/navbar/LocaleSwitcher";
import { openMobileFeedbackMenu } from "@/app/components/feedback/FeedbackWidget";
import { FULL_NAV_LINKS, navLinkClassName } from "@/app/components/navbar/navLinks";
import { useNavbarAuthUser } from "@/app/components/navbar/useNavbarAuthUser";

export default function NavbarMobileMenu() {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const tFeedback = useTranslations("feedback");
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const { user, isAdmin, isLoading } = useNavbarAuthUser();

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
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

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
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

      {open ? (
        <>
          <button
            type="button"
            aria-label={t("closeMenu")}
            className="fixed inset-0 top-16 z-[60] bg-black/60"
            onClick={closeMenu}
          />
          <div
            id={menuId}
            role="menu"
            className="glass-surface-strong scroll-touch fixed inset-x-0 top-16 z-[61] max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-white/10 p-3 shadow-2xl"
          >
            <nav className="grid gap-1" aria-label={t("primaryNav")}>
              {FULL_NAV_LINKS.map((link) => (
                <Link
                  key={`mobile-${link.href}-${link.labelKey}`}
                  href={link.href}
                  role="menuitem"
                  onClick={closeMenu}
                  className={`min-h-11 px-3 py-2.5 text-sm font-medium text-gray-200 ${navLinkClassName(link, "flex items-center rounded-xl transition")}`}
                >
                  {t(link.labelKey)}
                </Link>
              ))}
            </nav>

            <div
              className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3"
              role="group"
              aria-label={tCommon("language")}
            >
              <p className="mb-2 text-sm font-medium text-white">{tCommon("language")}</p>
              <div className="[&_label]:w-full [&_select]:w-full">
                <LocaleSwitcher />
              </div>
            </div>

            <div className="my-3 border-t border-white/10" aria-hidden="true" />

            <div className="grid gap-2">
              <Link
                href="/sell"
                role="menuitem"
                onClick={closeMenu}
                className={`${actionLinkClass} bg-blue-600 hover:bg-blue-500`}
              >
                {t("sellAHorse")}
              </Link>

              {isLoading ? (
                <div className="h-11 animate-pulse rounded-xl bg-white/10" aria-hidden="true" />
              ) : null}

              {!isLoading && !user ? (
                <>
                  <Link
                    href="/login"
                    role="menuitem"
                    onClick={closeMenu}
                    className={`${actionLinkClass} bg-white/10 hover:bg-white/20`}
                  >
                    {t("login")}
                  </Link>
                  <Link
                    href="/signup"
                    role="menuitem"
                    onClick={closeMenu}
                    className={`${actionLinkClass} border border-white/20 hover:bg-white hover:text-black`}
                  >
                    {t("signup")}
                  </Link>
                </>
              ) : null}

              {!isLoading && user ? (
                <>
                  {isAdmin ? (
                    <Link
                      href="/admin"
                      role="menuitem"
                      onClick={closeMenu}
                      className={`${actionLinkClass} border border-blue-500/40 text-blue-200 hover:bg-blue-500/10`}
                    >
                      {t("admin")}
                    </Link>
                  ) : null}
                  <Link
                    href="/account"
                    role="menuitem"
                    onClick={closeMenu}
                    className={`${actionLinkClass} border border-white/20 hover:bg-white/10`}
                  >
                    {t("account")}
                  </Link>
                  <div className="overflow-hidden rounded-xl border border-white/10">
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
                <span className="text-sm text-gray-400">{t("notifications")}</span>
                <NotificationBell />
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
