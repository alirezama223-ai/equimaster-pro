import { routing, type AppLocale } from "@/i18n/routing";

export function getPathnameWithoutLocale(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0) {
    return "/";
  }

  const maybeLocale = segments[0];

  if (routing.locales.includes(maybeLocale as AppLocale)) {
    const rest = segments.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }

  return pathname;
}

export function localizePath(pathname: string, locale: AppLocale): string {
  const pathWithoutLocale = getPathnameWithoutLocale(pathname);

  if (locale === routing.defaultLocale) {
    return pathWithoutLocale;
  }

  if (pathWithoutLocale === "/") {
    return `/${locale}`;
  }

  return `/${locale}${pathWithoutLocale.startsWith("/") ? pathWithoutLocale : `/${pathWithoutLocale}`}`;
}
