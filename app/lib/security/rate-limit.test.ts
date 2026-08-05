import { describe, expect, it } from "vitest";
import { checkRateLimit } from "@/app/lib/security/rate-limit";

describe("checkRateLimit", () => {
  it("allows requests under the limit", () => {
    const key = `test-${Date.now()}-allow`;
    expect(checkRateLimit(key, 3, 60_000).allowed).toBe(true);
    expect(checkRateLimit(key, 3, 60_000).allowed).toBe(true);
    expect(checkRateLimit(key, 3, 60_000).allowed).toBe(true);
  });

  it("blocks requests over the limit", () => {
    const key = `test-${Date.now()}-block`;
    expect(checkRateLimit(key, 2, 60_000).allowed).toBe(true);
    expect(checkRateLimit(key, 2, 60_000).allowed).toBe(true);

    const blocked = checkRateLimit(key, 2, 60_000);
    expect(blocked.allowed).toBe(false);
    if (!blocked.allowed) {
      expect(blocked.retryAfterMs).toBeGreaterThan(0);
    }
  });
});
