import Link from "next/link";
import NavbarAuthControls from "@/app/components/navbar/NavbarAuthControls";
import NavbarDesktopMenu from "@/app/components/navbar/NavbarDesktopMenu";
import {
  DESKTOP_INLINE_NAV_LINKS,
  navLinkClassName,
} from "@/app/components/navbar/navLinks";

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b border-white/10 bg-black/30 backdrop-blur-lg">
      <div className="mx-auto flex h-16 min-w-0 max-w-7xl items-center gap-3 px-4 sm:h-20 sm:gap-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="shrink-0 text-lg font-black text-white transition hover:text-blue-400 sm:text-xl 2xl:text-2xl"
        >
          EquiMaster Pro
        </Link>

        <nav
          className="hidden min-w-0 flex-1 items-center justify-center gap-x-3 gap-y-1 2xl:flex 2xl:gap-x-4"
          aria-label="Primary"
        >
          {DESKTOP_INLINE_NAV_LINKS.map((link) => (
            <Link
              key={`${link.href}-${link.label}`}
              href={link.href}
              className={`text-sm font-medium text-gray-300 ${navLinkClassName(link)}`}
            >
              {link.label === "Favorites" ? "❤️ Favorites" : link.label}
            </Link>
          ))}
          <Link href="#" className="text-sm font-medium text-gray-300 hover:text-white transition">
            About
          </Link>
        </nav>

        <div className="ml-auto flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
          <div className="2xl:hidden">
            <NavbarDesktopMenu />
          </div>

          <Link
            href="/sell"
            className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 lg:px-4 lg:py-2.5 2xl:px-5 2xl:py-3"
          >
            <span className="lg:hidden">Sell</span>
            <span className="hidden lg:inline">Sell a Horse</span>
          </Link>

          <NavbarAuthControls />
        </div>
      </div>
    </header>
  );
}
