import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "@/i18n/routing";
import { AUTH_CALLBACK_PATH } from "@/app/lib/auth/paths";
import { updateSession } from "@/app/lib/supabase/proxy";

const handleI18nRouting = createIntlMiddleware(routing);

function isAuthCallbackPath(pathname: string) {
  return (
    pathname === AUTH_CALLBACK_PATH ||
    pathname.startsWith(`${AUTH_CALLBACK_PATH}/`)
  );
}

function isStaticAsset(pathname: string) {
  return /\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm|mov|avif|woff|woff2|ttf|otf)$/i.test(
    pathname
  );
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // All API routes must bypass next-intl routing. API endpoints do not use
  // locale prefixes and must reach their route handlers unchanged.
  if (pathname === "/api" || pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Never send static assets through next-intl or auth routing.
  // This is especially important for video files such as shabdiz-hero.mp4.
  if (isStaticAsset(pathname)) {
    return NextResponse.next();
  }

  if (isAuthCallbackPath(pathname)) {
    return updateSession(request);
  }

  const intlResponse = handleI18nRouting(request);

  if (intlResponse.headers.get("location")) {
    return intlResponse;
  }

  return updateSession(request, intlResponse);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm|mov|avif|woff|woff2|ttf|otf)$).*)",
  ],
};
