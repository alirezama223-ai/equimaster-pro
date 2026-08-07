"use client";

import { usePathname } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { useCallback } from "react";
import { useNavbarAuthUser } from "@/app/components/navbar/useNavbarAuthUser";
import {
  navigateToProtectedRoute,
  type ProtectedNavigationResult,
} from "@/app/lib/auth/navigate-protected";
import type { AppLocale } from "@/i18n/routing";

export function useProtectedNavigation() {
  const pathname = usePathname();
  const locale = useLocale() as AppLocale;
  const { user, isLoading } = useNavbarAuthUser();

  const navigateProtected = useCallback(
    async (path: string): Promise<ProtectedNavigationResult> => {
      if (isLoading) {
        return "noop";
      }

      return navigateToProtectedRoute({
        path,
        locale,
        isAuthenticated: Boolean(user),
        currentPathname: pathname,
      });
    },
    [isLoading, locale, pathname, user]
  );

  return {
    navigateProtected,
    isLoading,
    isAuthenticated: Boolean(user),
  };
}
