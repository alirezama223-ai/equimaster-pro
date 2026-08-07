"use client";

import { Link, usePathname } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import type { ComponentProps } from "react";
import { navigateToProtectedRoute } from "@/app/lib/auth/navigate-protected";
import { isProtectedPath } from "@/app/lib/auth/protected-routes";
import { useNavbarAuthUser } from "@/app/components/navbar/useNavbarAuthUser";
import type { AppLocale } from "@/i18n/routing";

type Props = ComponentProps<typeof Link>;

function hrefToPath(href: Props["href"]): string | null {
  if (typeof href === "string") {
    return href;
  }

  if (typeof href === "object" && href !== null && "pathname" in href) {
    return typeof href.pathname === "string" ? href.pathname : null;
  }

  return null;
}

export default function ProtectedLink({
  href,
  onClick,
  prefetch,
  ...props
}: Props) {
  const pathname = usePathname();
  const locale = useLocale() as AppLocale;
  const { user, isLoading } = useNavbarAuthUser();
  const targetPath = hrefToPath(href);

  if (!targetPath || !isProtectedPath(targetPath)) {
    return (
      <Link href={href} onClick={onClick} prefetch={prefetch} {...props} />
    );
  }

  return (
    <Link
      href={href}
      prefetch={false}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented || isLoading) {
          return;
        }

        event.preventDefault();
        void navigateToProtectedRoute({
          path: targetPath,
          locale,
          isAuthenticated: Boolean(user),
          currentPathname: pathname,
        });
      }}
      {...props}
    />
  );
}
