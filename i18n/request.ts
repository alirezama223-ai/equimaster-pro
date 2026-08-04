import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

const namespaces = [
  "common", "nav", "auth", "metadata", "home", "marketplace", "sell", "account",
  "horse", "favorites", "training", "health", "admin", "breeding", "stallions",
  "breeders", "pedigree", "inquiries", "notifications", "demo", "bloodlines",
  "events", "traits", "feedback",
] as const;

async function loadMessages(locale: string) {
  const entries = await Promise.all(
    namespaces.map(async (namespace) => {
      const importedMessages = await import(`../messages/${locale}/${namespace}.json`);
      return [namespace, importedMessages.default] as const;
    })
  );
  return Object.fromEntries(entries);
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  return { locale, messages: await loadMessages(locale) };
});
