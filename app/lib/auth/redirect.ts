import { getPathnameWithoutLocale, localizePath } from "@/i18n/path";
import { routing, type AppLocale } from "@/i18n/routing";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AUTH_CALLBACK_PATH, getSafeNextPath } from "@/app/lib/auth/paths";

export function getLocaleFromPathname(pathname: string): AppLocale {
  const segments = pathname.split("/").filter(Boolean);
  const maybeLocale = segments[0];

  if (routing.locales.includes(maybeLocale as AppLocale)) {
    return maybeLocale as AppLocale;
  }

  return routing.defaultLocale;
}

export function resolveAppLocale(
  pathname: string,
  cookieLocale?: string | null
): AppLocale {
  if (cookieLocale && routing.locales.includes(cookieLocale as AppLocale)) {
    return cookieLocale as AppLocale;
  }

  return getLocaleFromPathname(pathname);
}

export function buildLocalizedPath(pathname: string, locale: AppLocale): string {
  return localizePath(getSafeNextPath(pathname), locale);
}

export function buildAuthCallbackUrl(origin: string, nextPath: string): string {
  const safeNext = getSafeNextPath(nextPath);
  return `${origin}${AUTH_CALLBACK_PATH}?next=${encodeURIComponent(safeNext)}`;
}

export async function waitForAuthSession(
  supabase: SupabaseClient,
  maxAttempts = 25,
  intervalMs = 80
): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session) {
      return true;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, intervalMs);
    });
  }

  return false;
}

export { getSafeNextPath } from "@/app/lib/auth/paths";
