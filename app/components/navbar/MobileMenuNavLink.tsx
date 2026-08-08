"use client";

import type { ReactNode } from "react";
import { useLocale } from "next-intl";
import { getPathnameWithoutLocale, localizePath } from "@/i18n/path";
import type { AppLocale } from "@/i18n/routing";
import {
  logMobileNavSessionState,
  logMobileNavStart,
  logMobileNavHardNavigation,
  runMobileNavInstrumented,
} from "@/app/lib/debug/mobile-nav-diagnostics";
import type { MobileNavSessionSnapshot } from "@/app/lib/debug/mobile-nav-diagnostics";

type Props = {
  href: string;
  className?: string;
  children: ReactNode;
  /** Fired after a navigation request has started (hard nav or in-drawer hash). */
  onNavigationStarted?: () => void;
  diagLabel?: string;
  diagSession?: MobileNavSessionSnapshot;
};

/** Localized href for mobile drawer anchors (testable, no Link wrapper). */
export function resolveMobileMenuHref(href: string, locale: AppLocale): string {
  if (href === "#" || href.startsWith("#")) {
    return href;
  }

  return localizePath(getPathnameWithoutLocale(href), locale);
}

/** DIAGNOSTIC ONLY — Safari navigation test. Revert after testing. */
export default function MobileMenuNavLink({
  href,
  className,
  children,
  diagLabel,
  diagSession,
}: Props) {
  const locale = useLocale() as AppLocale;
  const localizedHref = resolveMobileMenuHref(href, locale);

  return (
    <button
      type="button"
      role="menuitem"
      className={className}
      onClick={() => {
        runMobileNavInstrumented(
          diagLabel ?? "MobileMenuNavLink.click",
          () => {
            logMobileNavStart(localizedHref, diagSession);

            if (diagSession) {
              logMobileNavSessionState("menu-item-click", diagSession, {
                href: localizedHref,
              });
            }

            logMobileNavHardNavigation("window.location.href", localizedHref);
            window.location.href = href;
          },
          { href: localizedHref, rawHref: href, label: diagLabel }
        );
      }}
    >
      {children}
    </button>
  );
}
