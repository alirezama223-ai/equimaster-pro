"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useEffect, useId, useRef, useState } from "react";
import FloatingPortal from "@/app/components/shared/FloatingPortal";
import { FULL_NAV_LINKS, navLinkClassName } from "@/app/components/navbar/navLinks";
import { isFloatingOverlayNode } from "@/app/lib/floating-position";

export default function NavbarDesktopMenu() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if (isFloatingOverlayNode(target)) return;
      setOpen(false);
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-sm font-semibold text-white transition hover:bg-white/10 sm:w-auto sm:gap-2 sm:px-3 sm:py-2.5"
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
        <span className="hidden sm:inline">{t("menu")}</span>
      </button>

      {open ? (
        <FloatingPortal
          anchorRef={triggerRef}
          open={open}
          placement="bottom-end"
          matchWidth={false}
          floatingWidth={320}
        >
          <div
            id={menuId}
            role="menu"
            className="glass-surface-strong w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-white/10 p-2 shadow-2xl"
          >
            <nav className="grid gap-1">
              {FULL_NAV_LINKS.map((link) => (
                <Link
                  key={`${link.href}-${link.labelKey}`}
                  href={link.href}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className={`rounded-xl px-3 py-2.5 text-sm font-medium text-gray-200 ${navLinkClassName(link, "block")}`}
                >
                  {t(link.labelKey)}
                </Link>
              ))}
            </nav>
          </div>
        </FloatingPortal>
      ) : null}
    </div>
  );
}
