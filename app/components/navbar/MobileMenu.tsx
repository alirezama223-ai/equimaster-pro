"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import NotificationBell from "@/app/components/events/NotificationBell";
import LogoutButton from "@/app/components/auth/LogoutButton";
import LocaleSwitcher from "@/app/components/navbar/LocaleSwitcher";
import MobileMenuNavLink from "@/app/components/navbar/MobileMenuNavLink";
import { useNavbarBrandLabels } from "@/app/components/navbar/useNavbarBrandLabels";
import { FULL_NAV_LINKS, navLinkClassName } from "@/app/components/navbar/navLinks";
import { useNavbarAuthUser } from "@/app/components/navbar/useNavbarAuthUser";

export default function MobileMenu() {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const { brandShort } = useNavbarBrandLabels();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const { user, isAdmin, isLoading } = useNavbarAuthUser();

  const actionLinkClass =
    "flex min-h-11 items-center rounded-xl px-3 py-2.5 text-sm font-semibold text-white";

  return (
    <div className="relative shrink-0 md:hidden">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="dialog"
        aria-label={t("openMenu")}
        onClick={() => setOpen(true)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-white hover:bg-white/10"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path strokeLinecap="round" d="M4 7h16" />
          <path strokeLinecap="round" d="M4 12h16" />
          <path strokeLinecap="round" d="M4 17h16" />
        </svg>
      </button>

      {open ? (
        <div
          id={menuId}
          role="dialog"
          aria-modal="true"
          aria-label={t("menu")}
          className="fixed inset-0 z-[9999] flex w-full min-h-screen flex-col overflow-y-auto bg-slate-950 text-white"
        >
          <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-3 py-3">
            <span className="text-base font-black text-white">{brandShort}</span>
            <button
              type="button"
              aria-label={t("closeMenu")}
              onClick={() => setOpen(false)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-white hover:bg-slate-800"
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

          <div className="flex flex-col gap-1 p-3">
            <nav className="grid gap-1" aria-label={t("primaryNav")}>
              {FULL_NAV_LINKS.map((link) => (
                <MobileMenuNavLink
                  key={`mobile-${link.href}-${link.labelKey}`}
                  href={link.href}
                  className={`min-h-11 px-3 py-2.5 text-sm font-medium text-white ${navLinkClassName(link, "flex items-center rounded-xl")}`}
                >
                  {t(link.labelKey)}
                </MobileMenuNavLink>
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
              <MobileMenuNavLink
                href="/sell"
                className={`${actionLinkClass} bg-blue-600 hover:bg-blue-500`}
              >
                {t("sellAHorse")}
              </MobileMenuNavLink>

              {isLoading ? (
                <div className="h-11 rounded-xl bg-slate-800" aria-hidden="true" />
              ) : null}

              {!isLoading && !user ? (
                <>
                  <MobileMenuNavLink
                    href="/login"
                    className={`${actionLinkClass} bg-slate-900 hover:bg-slate-800`}
                  >
                    {t("login")}
                  </MobileMenuNavLink>
                  <MobileMenuNavLink
                    href="/signup"
                    className={`${actionLinkClass} border border-slate-800 hover:bg-slate-900`}
                  >
                    {t("signup")}
                  </MobileMenuNavLink>
                </>
              ) : null}

              {!isLoading && user ? (
                <>
                  {isAdmin ? (
                    <MobileMenuNavLink
                      href="/admin"
                      className={`${actionLinkClass} border border-blue-500/40 text-blue-200 hover:bg-blue-500/10`}
                    >
                      {t("admin")}
                    </MobileMenuNavLink>
                  ) : null}
                  <MobileMenuNavLink
                    href="/account"
                    className={`${actionLinkClass} border border-slate-800 hover:bg-slate-900`}
                  >
                    {t("account")}
                  </MobileMenuNavLink>
                  <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
                    <LogoutButton variant="menu" />
                  </div>
                </>
              ) : null}

              <div className="flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 py-2">
                <span className="text-sm text-slate-300">{t("notifications")}</span>
                <NotificationBell />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
