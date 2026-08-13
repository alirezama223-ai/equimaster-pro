"use client";

import { useMessages } from "next-intl";

const FALLBACK_BRAND = "SHABDIZ";
const FALLBACK_BRAND_SHORT = "SHABDIZ";

function readCommonString(
  messages: Record<string, unknown>,
  key: string
): string | undefined {
  const common = messages.common;
  if (!common || typeof common !== "object") {
    return undefined;
  }

  const value = (common as Record<string, unknown>)[key];
  return typeof value === "string" ? value : undefined;
}

/** Resolves brand labels from loaded messages with safe fallbacks for mobile navbar. */
export function useNavbarBrandLabels() {
  const messages = useMessages() as Record<string, unknown>;
  const brand = readCommonString(messages, "brand") ?? FALLBACK_BRAND;
  const brandShort =
    readCommonString(messages, "brandShort") ??
    readCommonString(messages, "brand") ??
    FALLBACK_BRAND_SHORT;

  return { brand, brandShort };
}
