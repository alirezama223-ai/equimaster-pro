import { buildAuthCallbackUrl } from "@/app/lib/auth/redirect";
import { UPDATE_PASSWORD_PATH } from "@/app/lib/auth/paths";

export const PASSWORD_RESET_RECOVERY_PARAM = "recovery";

/** Safe redirect target for Supabase password recovery emails. */
export function buildPasswordResetCallbackUrl(origin: string): string {
  return buildAuthCallbackUrl(origin, UPDATE_PASSWORD_PATH);
}

export function isPasswordRecoveryContext(
  searchParams: URLSearchParams,
  hashParams?: URLSearchParams
): boolean {
  if (searchParams.get(PASSWORD_RESET_RECOVERY_PARAM) === "1") {
    return true;
  }

  if (hashParams?.get("type") === "recovery") {
    return true;
  }

  return false;
}

export function appendPasswordRecoveryParam(pathname: string): string {
  const separator = pathname.includes("?") ? "&" : "?";
  return `${pathname}${separator}${PASSWORD_RESET_RECOVERY_PARAM}=1`;
}
