import { getPathnameWithoutLocale } from "@/i18n/path";

/** Canonical authentication routes (App Router). */
export const LOGIN_PATH = "/login";
export const SIGNUP_PATH = "/signup";
export const AUTH_CALLBACK_PATH = "/auth/callback";

const AUTH_ROUTES = new Set([LOGIN_PATH, SIGNUP_PATH]);

/** Locale-free internal path safe for `?next=` and i18n router navigation. */
export function getSafeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/account";
  }

  const withoutLocale = getPathnameWithoutLocale(next);

  if (AUTH_ROUTES.has(withoutLocale)) {
    return "/account";
  }

  return withoutLocale;
}

export function loginRedirectPath(nextPath?: string | null): string {
  if (!nextPath) {
    return LOGIN_PATH;
  }

  const safeNext = getSafeNextPath(nextPath);

  if (safeNext === LOGIN_PATH) {
    return LOGIN_PATH;
  }

  return `${LOGIN_PATH}?next=${encodeURIComponent(safeNext)}`;
}
