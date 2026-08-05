"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import NavbarAuthControls from "@/app/components/navbar/NavbarAuthControls";
import NavbarDesktopMenu from "@/app/components/navbar/NavbarDesktopMenu";
import NotificationBell from "@/app/components/events/NotificationBell";
import LocaleSwitcher from "@/app/components/navbar/LocaleSwitcher";
import {
  DESKTOP_INLINE_NAV_LINKS,
  navLinkClassName,
} from "@/app/components/navbar/navLinks";

export default function Navbar() {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");

  return (
    <header className="glass-surface fixed top-0 left-0 z-50 w-full border-b border-white/10">
      <div className="mx-auto flex h-16 min-w-0 max-w-7xl items-center gap-2 px-3 sm:h-20 sm:gap-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="inline-flex min-h-11 min-w-0 max-w-[9.5rem] items-center truncate text-base font-black text-white transition hover:text-blue-400 sm:max-w-none sm:shrink-0 sm:text-lg 2xl:text-2xl"
        >
          <span className="sm:hidden">{tCommon("brandShort")}</span>
          <span className="hidden sm:inline">{tCommon("brand")}</span>
        </Link>

        <nav
          className="hidden min-w-0 flex-1 items-center justify-center gap-x-3 gap-y-1 2xl:flex 2xl:gap-x-4"
          aria-label={t("primaryNav")}
        >
          {DESKTOP_INLINE_NAV_LINKS.map((link) => (
            <Link
              key={`${link.href}-${link.labelKey}`}
              href={link.href}
              className={`text-sm font-medium text-gray-300 ${navLinkClassName(link)}`}
            >
              {t(link.labelKey)}
            </Link>
          ))}
          <Link href="#" className="text-sm font-medium text-gray-300 hover:text-white transition">
            {t("about")}
          </Link>
        </nav>

        <div className="ml-auto flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-3">
          <div className="hidden md:block">
            <LocaleSwitcher />
          </div>

          <div className="2xl:hidden">
            <NavbarDesktopMenu />
          </div>

          <Link
            href="/sell"
            aria-label={t("sellAHorse")}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-500 sm:h-auto sm:w-auto sm:px-3 sm:py-2.5 lg:px-4 lg:py-2.5 2xl:px-5 2xl:py-3"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="h-5 w-5 sm:hidden"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
            </svg>
            <span className="hidden sm:inline lg:hidden">{t("sell")}</span>
            <span className="hidden lg:inline">{t("sellAHorse")}</span>
          </Link>

          <div className="hidden sm:block">
            <NotificationBell />
          </div>

          <NavbarAuthControls />
        </div>
      </div>
    </header>
  );
}
