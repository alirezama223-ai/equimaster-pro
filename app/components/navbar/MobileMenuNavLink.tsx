"use client";

import { useLocale } from "next-intl";
import type { MouseEvent, ReactNode } from "react";
import { getPathnameWithoutLocale, localizePath } from "@/i18n/path";
import type { AppLocale } from "@/i18n/routing";

type Props = {
  href: string;
  className?: string;
  children: ReactNode;
  /** Fired after a navigation request has started (hard nav or in-drawer hash). */
  onNavigationStarted?: () => void;
};

/** Localized href for mobile drawer anchors (testable, no Link wrapper). */
export function resolveMobileMenuHref(href: string, locale: AppLocale): string {
  if (href === "#" || href.startsWith("#")) {
    return href;
  }

  return localizePath(getPathnameWithoutLocale(href), locale);
}

/**
 * Mobile drawer nav item — native anchor + synchronous hard navigation only.
 * No next-intl Link, no ProtectedLink; single mechanism via window.location.assign.
 */
export default function MobileMenuNavLink({
  href,
  className,
  children,
  onNavigationStarted,
}: Props) {
  const locale = useLocale() as AppLocale;
  const localizedHref = resolveMobileMenuHref(href, locale);
  const isHashLink = localizedHref === "#" || localizedHref.startsWith("#");

  function startNavigation() {
    if (isHashLink) {
      onNavigationStarted?.();
      return;
    }

    window.location.assign(localizedHref);
    onNavigationStarted?.();
  }

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented) {
      return;
    }

    event.preventDefault();
    startNavigation();
  }

  return (
    <a
      href={localizedHref}
      role="menuitem"
      className={className}
      onClick={handleClick}
    >
      {children}
    </a>
  );
}
