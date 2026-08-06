"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useState } from "react";

type NavItem = {
  href: string;
  key:
    | "dashboard"
    | "users"
    | "listings"
    | "sellers"
    | "reports"
    | "settings"
    | "breeders"
    | "stallions"
    | "pedigree"
    | "traits"
    | "feedback";
  exact?: boolean;
  section?: "primary" | "catalog";
};

const primaryLinks: NavItem[] = [
  { href: "/admin", key: "dashboard", exact: true },
  { href: "/admin/users", key: "users" },
  { href: "/admin/listings", key: "listings" },
  { href: "/admin/sellers", key: "sellers" },
  { href: "/admin/reports", key: "reports" },
  { href: "/admin/settings", key: "settings" },
];

const catalogLinks: NavItem[] = [
  { href: "/admin/breeders", key: "breeders", section: "catalog" },
  { href: "/admin/stallions", key: "stallions", section: "catalog" },
  { href: "/admin/pedigree", key: "pedigree", section: "catalog" },
  { href: "/admin/traits", key: "traits", section: "catalog" },
  { href: "/admin/feedback", key: "feedback", section: "catalog" },
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

type Props = {
  children: React.ReactNode;
};

export default function AdminShell({ children }: Props) {
  const t = useTranslations("admin");
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function renderLink(item: NavItem) {
    const active = isActive(pathname, item.href, item.exact);

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={`flex min-h-11 items-center rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
          active
            ? "bg-blue-600 text-white shadow-[0_8px_24px_rgba(37,99,235,0.35)]"
            : "text-gray-300 hover:bg-white/[0.05] hover:text-white"
        }`}
      >
        {t(`nav.${item.key}`)}
      </Link>
    );
  }

  const sidebar = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b border-white/10 px-4 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
          {t("brandEyebrow")}
        </p>
        <p className="mt-1 text-lg font-black text-white">{t("shell.title")}</p>
        <p className="mt-1 text-xs text-gray-500">{t("shell.subtitle")}</p>
      </div>

      <nav className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
        <div className="space-y-1">
          <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
            {t("shell.sections.platform")}
          </p>
          {primaryLinks.map(renderLink)}
        </div>

        <div className="space-y-1">
          <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">
            {t("shell.sections.catalog")}
          </p>
          {catalogLinks.map(renderLink)}
        </div>
      </nav>

      <div className="border-t border-white/10 p-4">
        <Link
          href="/account"
          className="flex min-h-11 items-center justify-center rounded-xl border border-white/10 px-4 text-sm font-semibold text-gray-200 transition hover:border-blue-500/40 hover:text-white"
        >
          {t("dashboard.backToAccount")}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#08111F] text-white">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#08111F]/95 backdrop-blur-xl lg:hidden">
        <div className="flex min-h-16 items-center justify-between gap-3 px-4">
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-white">{t("shell.title")}</p>
            <p className="truncate text-xs text-gray-500">{t("adminEyebrow")}</p>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen((current) => !current)}
            className="inline-flex h-11 min-w-11 items-center justify-center rounded-xl border border-white/10 px-4 text-sm font-semibold"
            aria-expanded={mobileOpen}
            aria-controls="admin-mobile-nav"
          >
            {mobileOpen ? t("shell.closeMenu") : t("shell.openMenu")}
          </button>
        </div>
      </header>

      {mobileOpen ? (
        <div
          id="admin-mobile-nav"
          className="fixed inset-0 z-50 bg-black/60 lg:hidden"
          onClick={() => setMobileOpen(false)}
        >
          <aside
            className="h-full w-[min(100vw-2rem,20rem)] border-r border-white/10 bg-[#0a1527] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-[#0a1527]/80 lg:block">
          {sidebar}
        </aside>

        <div className="min-w-0 flex-1">
          <div className="hidden border-b border-white/10 px-6 py-5 lg:block">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-400">
              {t("adminEyebrow")}
            </p>
            <h1 className="mt-1 text-2xl font-black text-white">{t("shell.title")}</h1>
          </div>
          <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
