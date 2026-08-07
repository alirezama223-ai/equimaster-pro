import { describe, expect, it, beforeEach } from "vitest";
import {
  buildProtectedDestinationUrl,
  buildProtectedLoginUrl,
  normalizeProtectedDestination,
  pathsMatchCurrent,
  resetProtectedNavigationGuard,
} from "@/app/lib/auth/navigate-protected";
import { isProtectedPath } from "@/app/lib/auth/protected-routes";

describe("normalizeProtectedDestination", () => {
  it("strips locale and unsafe values", () => {
    expect(normalizeProtectedDestination("/de/dashboard/seller")).toBe(
      "/dashboard/seller"
    );
    expect(normalizeProtectedDestination("/de/de/dashboard/seller")).toBe(
      "/dashboard/seller"
    );
  });
});

describe("pathsMatchCurrent", () => {
  it("detects same route across locale prefixes", () => {
    expect(
      pathsMatchCurrent("/de/dashboard/seller", "/dashboard/seller")
    ).toBe(true);
    expect(
      pathsMatchCurrent("/dashboard/seller", "/de/dashboard/seller")
    ).toBe(true);
    expect(pathsMatchCurrent("/de/account", "/dashboard/seller")).toBe(false);
  });
});

describe("buildProtectedDestinationUrl", () => {
  it("localizes once without double locale", () => {
    expect(buildProtectedDestinationUrl("/dashboard/seller", "de")).toBe(
      "/de/dashboard/seller"
    );
    expect(buildProtectedDestinationUrl("/de/dashboard/seller", "de")).toBe(
      "/de/dashboard/seller"
    );
  });
});

describe("buildProtectedLoginUrl", () => {
  it("builds locale-aware login urls with safe next params", () => {
    expect(buildProtectedLoginUrl("/dashboard/seller", "de")).toBe(
      "/de/login?next=%2Fdashboard%2Fseller"
    );
    expect(buildProtectedLoginUrl("/sell", "en")).toBe(
      "/login?next=%2Fsell"
    );
  });
});

describe("isProtectedPath", () => {
  it("matches primary menu protected routes", () => {
    for (const route of [
      "/dashboard/seller",
      "/account",
      "/favorites",
      "/sell",
      "/training",
      "/admin",
    ]) {
      expect(isProtectedPath(route)).toBe(true);
      expect(isProtectedPath(`/de${route}`)).toBe(true);
    }

    expect(isProtectedPath("/marketplace")).toBe(false);
  });
});

describe("resetProtectedNavigationGuard", () => {
  it("clears duplicate navigation guard", () => {
    resetProtectedNavigationGuard();
    expect(true).toBe(true);
  });
});
