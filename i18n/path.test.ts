import { describe, expect, it } from "vitest";
import { getPathnameWithoutLocale, localizePath } from "@/i18n/path";

describe("localizePath", () => {
  it("adds locale once for locale-free paths", () => {
    expect(localizePath("/dashboard/seller", "de")).toBe("/de/dashboard/seller");
    expect(localizePath("/dashboard/seller", "en")).toBe("/dashboard/seller");
  });

  it("does not double-prefix when path already includes locale", () => {
    expect(localizePath("/de/dashboard/seller", "de")).toBe("/de/dashboard/seller");
    expect(localizePath("/fr/account", "de")).toBe("/de/account");
  });

  it("strips locale before applying default locale", () => {
    expect(localizePath("/de/dashboard/seller", "en")).toBe("/dashboard/seller");
  });
});

describe("getPathnameWithoutLocale", () => {
  it("removes supported locale prefixes", () => {
    expect(getPathnameWithoutLocale("/de/dashboard/seller")).toBe("/dashboard/seller");
    expect(getPathnameWithoutLocale("/dashboard/seller")).toBe("/dashboard/seller");
  });
});
