import { routing } from "@/i18n/routing";

/** Paths blocked from crawling (locale-neutral). */
export const DISALLOWED_PATH_PREFIXES = [
  "/admin",
  "/dashboard",
  "/account",
  "/login",
  "/signup",
  "/favorites",
  "/notifications",
  "/training",
  "/sell",
] as const;

export function buildDisallowedPaths(): string[] {
  const paths = new Set<string>();

  for (const prefix of DISALLOWED_PATH_PREFIXES) {
    paths.add(prefix);

    for (const locale of routing.locales) {
      if (locale === routing.defaultLocale) {
        continue;
      }
      paths.add(`/${locale}${prefix}`);
    }
  }

  return [...paths].sort();
}
