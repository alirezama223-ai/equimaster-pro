import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  buildLocalizedPath,
  resolveAppLocale,
} from "@/app/lib/auth/redirect";
import { getSafeNextPath, LOGIN_PATH, UPDATE_PASSWORD_PATH } from "@/app/lib/auth/paths";
import { createClient } from "@/app/lib/supabase/server";
import { localizePath } from "@/i18n/path";
import { appendPasswordRecoveryParam } from "@/app/lib/auth/password-reset";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeNextPath(requestUrl.searchParams.get("next"));
  const cookieStore = await cookies();
  const locale = resolveAppLocale(
    requestUrl.pathname,
    cookieStore.get("NEXT_LOCALE")?.value
  );

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      let destination = buildLocalizedPath(next, locale);

      if (next === UPDATE_PASSWORD_PATH) {
        destination = appendPasswordRecoveryParam(destination);
      }

      return NextResponse.redirect(`${requestUrl.origin}${destination}`);
    }
  }

  return NextResponse.redirect(
    `${requestUrl.origin}${localizePath(LOGIN_PATH, locale)}?error=auth_callback_failed`
  );
}
