import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";
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

export async function proxy(request: NextRequest) {
  if (isAuthCallbackPath(request.nextUrl.pathname)) {
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
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
