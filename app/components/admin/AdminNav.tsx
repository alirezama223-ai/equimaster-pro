"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/breeders", label: "Breeders" },
  { href: "/admin/stallions", label: "Stallions" },
  { href: "/admin/pedigree", label: "Pedigree" },
  { href: "/admin/traits", label: "Traits" },
];

export default function AdminNav() {
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
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
