import { describe, expect, it } from "vitest";
import { resolveMobileMenuHref } from "@/app/components/navbar/MobileMenuNavLink";

describe("resolveMobileMenuHref", () => {
  it("localizes protected mobile menu destinations once", () => {
    expect(resolveMobileMenuHref("/account", "de")).toBe("/de/account");
    expect(resolveMobileMenuHref("/admin", "de")).toBe("/de/admin");
    expect(resolveMobileMenuHref("/favorites", "de")).toBe("/de/favorites");
    expect(resolveMobileMenuHref("/dashboard/seller", "de")).toBe(
      "/de/dashboard/seller"
    );
  });

  it("keeps default locale paths unprefixed", () => {
    expect(resolveMobileMenuHref("/account", "en")).toBe("/account");
  });

  it("passes through hash links unchanged", () => {
    expect(resolveMobileMenuHref("#", "de")).toBe("#");
  });
});
