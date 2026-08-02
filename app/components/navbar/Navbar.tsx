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
    <header className="fixed top-0 left-0 z-50 w-full border-b border-white/10 bg-black/30 backdrop-blur-lg">
      <div className="mx-auto flex h-16 min-w-0 max-w-7xl items-center gap-3 px-4 sm:h-20 sm:gap-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="shrink-0 text-lg font-black text-white transition hover:text-blue-400 sm:text-xl 2xl:text-2xl"
        >
          {tCommon("brand")}
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

        <div className="ml-auto flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden sm:block">
            <LocaleSwitcher />
          </div>

          <div className="2xl:hidden">
            <NavbarDesktopMenu />
          </div>

          <Link
            href="/sell"
            className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 lg:px-4 lg:py-2.5 2xl:px-5 2xl:py-3"
          >
            <span className="lg:hidden">{t("sell")}</span>
            <span className="hidden lg:inline">{t("sellAHorse")}</span>
          </Link>

          <NotificationBell />

          <NavbarAuthControls />
        </div>
      </div>
    </header>
  );
}
