import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

const namespaces = [
  "common", "nav", "auth", "metadata", "home", "marketplace", "dashboard", "sell", "account",
  "horse", "favorites", "training", "health", "admin", "breeding", "stallions",
  "breeders", "pedigree", "inquiries", "messaging", "notifications", "demo", "bloodlines",
  "events", "traits", "feedback", "verification", "subscription", "savedSearch", "news",
] as const;

function deepMerge(base: Record<string, unknown>, override: Record<string, unknown>) {
  const result: Record<string, unknown> = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const baseValue = result[key];

    if (
      value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      baseValue &&
      typeof baseValue === "object" &&
      !Array.isArray(baseValue)
    ) {
      result[key] = deepMerge(
        baseValue as Record<string, unknown>,
        value as Record<string, unknown>
      );
    } else {
      result[key] = value;
    }
  }

  return result;
}

async function loadMessages(locale: string) {
  const entries = await Promise.all(
    namespaces.map(async (namespace) => {
      const [fallbackMessages, localizedMessages] = await Promise.all([
        import(`../messages/en/${namespace}.json`),
        locale === "en"
          ? Promise.resolve(null)
          : import(`../messages/${locale}/${namespace}.json`),
      ]);

      const messages =
        locale === "en"
          ? fallbackMessages.default
          : deepMerge(
              fallbackMessages.default as Record<string, unknown>,
              localizedMessages?.default as Record<string, unknown>
            );

      return [namespace, messages] as const;
    })
  );

  return Object.fromEntries(entries);
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  return { locale, messages: await loadMessages(locale) };
});
