import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { loginRedirectPath } from "@/app/lib/auth/paths";
import { getSupabaseEnv } from "@/app/lib/supabase/env";
import { getPathnameWithoutLocale } from "@/i18n/path";

const protectedRoutes = [
  "/account",
  "/sell",
  "/admin",
  "/dashboard/seller",
  "/favorites",
  "/training",
  "/notifications",
  "/inbox",
];

function isProtectedPath(pathname: string) {
  return protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isAuthPath(pathname: string) {
  return (
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname.startsWith("/auth/")
  );
}

export async function updateSession(
  request: NextRequest,
  response: NextResponse = NextResponse.next({ request })
) {
  const pathname = getPathnameWithoutLocale(request.nextUrl.pathname);
  const { url, anonKey, isConfigured } = getSupabaseEnv();

  if (!isConfigured) {
    if (isProtectedPath(pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = loginRedirectPath(request.nextUrl.pathname);
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
    return NextResponse.redirect(
      new URL(loginRedirectPath(request.nextUrl.pathname), request.url)
    );
  }

  if (isAuthenticated && isAuthPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/account";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
