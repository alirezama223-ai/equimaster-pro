import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  getLocaleFromPathname,
  resolveAppLocale,
} from "@/app/lib/auth/redirect";
import { getSafeNextPath, LOGIN_PATH } from "@/app/lib/auth/paths";
import { isProtectedPath } from "@/app/lib/auth/protected-routes";
import { getSupabaseEnv } from "@/app/lib/supabase/env";
import { getPathnameWithoutLocale, localizePath } from "@/i18n/path";

function isAuthPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/auth/")
  );
}

function buildLoginRedirect(
  request: NextRequest,
  returnPath: string,
  fallback: NextResponse
) {
  const pathname = getPathnameWithoutLocale(request.nextUrl.pathname);
  const safeNext = getSafeNextPath(getPathnameWithoutLocale(returnPath));
  const locale = resolveAppLocale(
    request.nextUrl.pathname,
    request.cookies.get("NEXT_LOCALE")?.value
  );

  if (pathname === LOGIN_PATH) {
    const existingNext = getSafeNextPath(
      request.nextUrl.searchParams.get("next")
    );
    if (existingNext === safeNext) {
      return fallback;
    }
  }

  const redirectUrl = new URL(localizePath(LOGIN_PATH, locale), request.url);
  redirectUrl.searchParams.set("next", safeNext);
  return NextResponse.redirect(redirectUrl);
}

function buildPostAuthRedirect(
  request: NextRequest,
  nextPath: string,
  fallback: NextResponse
) {
  const pathname = getPathnameWithoutLocale(request.nextUrl.pathname);
  const target = getSafeNextPath(nextPath);
  const locale = resolveAppLocale(
    request.nextUrl.pathname,
    request.cookies.get("NEXT_LOCALE")?.value
  );
  const localizedTarget = localizePath(target, locale);

  if (pathname === target || request.nextUrl.pathname === localizedTarget) {
    return fallback;
  }

  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = localizedTarget;
  redirectUrl.search = "";
  return NextResponse.redirect(redirectUrl);
}

export async function updateSession(
  request: NextRequest,
  response: NextResponse = NextResponse.next({ request })
) {
  const pathname = getPathnameWithoutLocale(request.nextUrl.pathname);
  const { url, anonKey, isConfigured } = getSupabaseEnv();

  if (!isConfigured) {
    if (isProtectedPath(pathname)) {
      const redirectUrl = new URL(
        localizePath(LOGIN_PATH, getLocaleFromPathname(request.nextUrl.pathname)),
        request.url
      );
      redirectUrl.searchParams.set(
        "next",
        getSafeNextPath(request.nextUrl.pathname)
      );
      redirectUrl.searchParams.set("error", "supabase_not_configured");
      return NextResponse.redirect(redirectUrl);
    }

    return response;
  }

  let supabaseResponse = response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        supabaseResponse = NextResponse.next({
          request,
          headers: response.headers,
        });

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });

        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });

        response.cookies.getAll().forEach(({ name, value }) => {
          if (!supabaseResponse.cookies.get(name)) {
            supabaseResponse.cookies.set(name, value);
          }
        });
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  const isAuthenticated = !error && Boolean(data?.claims);

  if (!isAuthenticated && isProtectedPath(pathname)) {
    return buildLoginRedirect(request, request.nextUrl.pathname, supabaseResponse);
  }

  if (isAuthenticated && isAuthPath(pathname)) {
    if (pathname.startsWith("/auth/callback")) {
      return supabaseResponse;
    }

    const nextFromQuery = request.nextUrl.searchParams.get("next");

    // Client completes protected navigation after cookies stabilize (Mobile Safari).
    if (nextFromQuery) {
      return supabaseResponse;
    }

    return buildPostAuthRedirect(request, "/account", supabaseResponse);
  }

  return supabaseResponse;
}
