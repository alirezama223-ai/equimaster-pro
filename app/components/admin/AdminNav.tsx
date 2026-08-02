"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

const links = [
  { href: "/admin", key: "dashboard" as const, exact: true },
  { href: "/admin/breeders", key: "breeders" as const },
  { href: "/admin/stallions", key: "stallions" as const },
  { href: "/admin/pedigree", key: "pedigree" as const },
  { href: "/admin/traits", key: "traits" as const },
];

export default function AdminNav() {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-3">
      {links.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              active
                ? "bg-blue-600 text-white"
                : "border border-white/10 text-gray-300 hover:border-blue-500/40 hover:text-white"
            }`}
          >
            {t(link.key)}
          </Link>
        );
      })}
    </nav>
  );
}
