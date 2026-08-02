/** Canonical authentication routes (App Router). */
export const LOGIN_PATH = "/login";
export const SIGNUP_PATH = "/signup";

export function loginRedirectPath(nextPath?: string | null): string {
  if (!nextPath || nextPath === LOGIN_PATH) {
    return LOGIN_PATH;
  }

  return `${LOGIN_PATH}?next=${encodeURIComponent(nextPath)}`;
}
