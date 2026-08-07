import { routing, type AppLocale } from "@/i18n/routing";

export function getPathnameWithoutLocale(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);

  while (
    segments.length > 0 &&
    routing.locales.includes(segments[0] as AppLocale)
  ) {
    segments.shift();
  }

  if (segments.length === 0) {
    return "/";
  }

  return `/${segments.join("/")}`;
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
