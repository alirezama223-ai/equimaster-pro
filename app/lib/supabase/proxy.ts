import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/app/lib/supabase/env";

const protectedRoutes = ["/account", "/sell", "/admin"];

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

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { url, anonKey, isConfigured } = getSupabaseEnv();

  if (!isConfigured) {
    if (isProtectedPath(request.nextUrl.pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/login";
      redirectUrl.searchParams.set("next", request.nextUrl.pathname);
      redirectUrl.searchParams.set("error", "supabase_not_configured");
      return NextResponse.redirect(redirectUrl);
    }

    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        supabaseResponse = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });

        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  const { data, error } = await supabase.auth.getClaims();
  const isAuthenticated = !error && Boolean(data?.claims);

  if (!isAuthenticated && isProtectedPath(request.nextUrl.pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (isAuthenticated && isAuthPath(request.nextUrl.pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/account";
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
