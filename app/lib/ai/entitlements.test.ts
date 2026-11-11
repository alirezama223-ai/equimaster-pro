import { describe, expect, it } from "vitest";
import { isActivePaidAiSubscription } from "@/app/lib/ai/entitlements";

describe("isActivePaidAiSubscription", () => {
  it("allows active Pro and Enterprise subscriptions", () => {
    expect(isActivePaidAiSubscription("active", { slug: "pro", active: true })).toBe(true);
    expect(isActivePaidAiSubscription("active", { slug: "enterprise", active: true })).toBe(true);
  });

  it("does not allow the Free plan", () => {
    expect(isActivePaidAiSubscription("active", { slug: "free", active: true })).toBe(false);
  });

  it("does not allow subscriptions that are not active", () => {
    for (const status of ["trialing", "past_due", "canceled", "incomplete", "paused"]) {
      expect(isActivePaidAiSubscription(status, { slug: "pro", active: true })).toBe(false);
    }
  });

  it("does not allow inactive, missing, or unknown plans", () => {
    expect(isActivePaidAiSubscription("active", { slug: "pro", active: false })).toBe(false);
    expect(isActivePaidAiSubscription("active", null)).toBe(false);
    expect(isActivePaidAiSubscription("active", { slug: "custom", active: true })).toBe(false);
  });

  it("accepts the one-to-one relation shape returned as an array", () => {
    expect(isActivePaidAiSubscription("active", [{ slug: "pro", active: true }])).toBe(true);
  });
});
