import { getPathnameWithoutLocale } from "@/i18n/path";

/** Routes that require authentication (middleware + client navigation). */
export const PROTECTED_ROUTE_PREFIXES = [
  "/account",
  "/sell",
  "/admin",
  "/dashboard/seller",
  "/favorites",
  "/training",
  "/notifications",
  "/inbox",
] as const;

/** Primary protected destinations linked from the mobile menu. */
export const PRIMARY_PROTECTED_ROUTES = [
  "/dashboard/seller",
  "/account",
  "/favorites",
  "/sell",
  "/training",
  "/admin",
] as const;

export type PrimaryProtectedRoute = (typeof PRIMARY_PROTECTED_ROUTES)[number];

export function isProtectedPath(pathname: string): boolean {
  const path = getPathnameWithoutLocale(pathname);
  return PROTECTED_ROUTE_PREFIXES.some(
    (route) => path === route || path.startsWith(`${route}/`)
  );
}
