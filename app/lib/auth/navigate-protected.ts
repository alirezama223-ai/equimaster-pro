import type { SupabaseClient } from "@supabase/supabase-js";
import { getPathnameWithoutLocale, localizePath } from "@/i18n/path";
import type { AppLocale } from "@/i18n/routing";
import {
  getSafeNextPath,
  LOGIN_PATH,
  loginRedirectPath,
} from "@/app/lib/auth/paths";
import { waitForAuthSession } from "@/app/lib/auth/redirect";
import { isProtectedPath } from "@/app/lib/auth/protected-routes";
import { createClient } from "@/app/lib/supabase/client";
import { getSupabaseEnv } from "@/app/lib/supabase/env";

export type ProtectedNavigationResult = "navigated" | "login" | "noop" | "failed";

const DUPLICATE_NAV_WINDOW_MS = 5000;

let lastNavigationTarget: string | null = null;
let lastNavigationAt = 0;

/** Locale-free protected destination safe for `?next=` and comparisons. */
export function normalizeProtectedDestination(path: string): string {
  return getSafeNextPath(getPathnameWithoutLocale(path));
}

export function pathsMatchCurrent(
  currentPathname: string,
  targetPath: string
): boolean {
  return (
    normalizeProtectedDestination(currentPathname) ===
    normalizeProtectedDestination(targetPath)
  );
}

export function buildProtectedDestinationUrl(
  path: string,
  locale: AppLocale
): string {
  return localizePath(normalizeProtectedDestination(path), locale);
}

export function buildProtectedLoginUrl(
  path: string,
  locale: AppLocale
): string {
  const normalized = normalizeProtectedDestination(path);
  return localizePath(loginRedirectPath(normalized), locale);
}

function readLoginNextPath(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return new URL(window.location.href).searchParams.get("next");
}

function shouldSkipDuplicateNavigation(targetUrl: string): boolean {
  if (lastNavigationTarget !== targetUrl) {
    return false;
  }

  return Date.now() - lastNavigationAt < DUPLICATE_NAV_WINDOW_MS;
}

function markNavigation(targetUrl: string) {
  lastNavigationTarget = targetUrl;
  lastNavigationAt = Date.now();
}

export function resetProtectedNavigationGuard() {
  lastNavigationTarget = null;
  lastNavigationAt = 0;
}

export type NavigateToProtectedRouteOptions = {
  path: string;
  locale: AppLocale;
  isAuthenticated: boolean;
  currentPathname: string;
  /** When false, skip waiting (caller already confirmed the session). */
  waitForSession?: boolean;
  supabase?: SupabaseClient;
};

/**
 * Central client navigation for protected routes.
 * Uses hard navigation so middleware sees auth cookies on Mobile Safari.
 */
export async function navigateToProtectedRoute(
  options: NavigateToProtectedRouteOptions
): Promise<ProtectedNavigationResult> {
  if (typeof window === "undefined") {
    return "failed";
  }

  const normalizedTarget = normalizeProtectedDestination(options.path);

  if (!isProtectedPath(normalizedTarget)) {
    return "failed";
  }

  if (pathsMatchCurrent(options.currentPathname, normalizedTarget)) {
    return "noop";
  }

  if (!options.isAuthenticated) {
    const loginUrl = buildProtectedLoginUrl(normalizedTarget, options.locale);
    const onLogin =
      getPathnameWithoutLocale(options.currentPathname) === LOGIN_PATH;
    const pendingNext = getSafeNextPath(readLoginNextPath());

    if (onLogin && pendingNext === normalizedTarget) {
      return "noop";
    }

    if (shouldSkipDuplicateNavigation(loginUrl)) {
      return "noop";
    }

    markNavigation(loginUrl);
    window.location.assign(loginUrl);
    return "login";
  }

  const destinationUrl = buildProtectedDestinationUrl(
    normalizedTarget,
    options.locale
  );

  if (window.location.pathname === destinationUrl) {
    return "noop";
  }

  if (shouldSkipDuplicateNavigation(destinationUrl)) {
    return "noop";
  }

  if (options.waitForSession !== false && getSupabaseEnv().isConfigured) {
    const supabase = options.supabase ?? createClient();
    const ready = await waitForAuthSession(supabase);
    if (!ready) {
      return "failed";
    }
  }

  markNavigation(destinationUrl);
  window.location.replace(destinationUrl);
  return "navigated";
}
