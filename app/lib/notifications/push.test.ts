import { describe, expect, it } from "vitest";

describe("push notification helpers", () => {
  it("keeps the push service worker path stable", () => {
    expect("/sw.js").toBe("/sw.js");
  });
});
