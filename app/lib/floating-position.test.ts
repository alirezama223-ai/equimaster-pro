import { describe, expect, it, beforeEach, vi } from "vitest";
import { computeFloatingPosition } from "@/app/lib/floating-position";

describe("computeFloatingPosition", () => {
  beforeEach(() => {
    vi.stubGlobal("window", {
      innerWidth: 1024,
      innerHeight: 768,
    });
  });

  it("positions below the anchor by default", () => {
    const result = computeFloatingPosition(
      {
        x: 100,
        y: 200,
        width: 240,
        height: 44,
        top: 200,
        left: 100,
        right: 340,
        bottom: 244,
        toJSON: () => ({}),
      },
      {
        placement: "bottom-start",
        offset: 8,
        matchWidth: true,
      }
    );

    expect(result.placement).toBe("bottom");
    expect(result.top).toBe(252);
    expect(result.left).toBe(100);
    expect(result.width).toBe(240);
  });

  it("flips above when there is more space on top", () => {
    vi.stubGlobal("window", {
      innerWidth: 1024,
      innerHeight: 768,
    });

    const result = computeFloatingPosition(
      {
        x: 100,
        y: 700,
        width: 240,
        height: 44,
        top: 700,
        left: 100,
        right: 340,
        bottom: 744,
        toJSON: () => ({}),
      },
      {
        placement: "bottom-start",
        offset: 8,
        matchWidth: true,
        floatingHeight: 180,
      }
    );

    expect(result.placement).toBe("top");
    expect(result.top).toBeLessThan(700);
  });

  it("aligns to the end edge when requested", () => {
    vi.stubGlobal("window", {
      innerWidth: 1024,
      innerHeight: 768,
    });

    const result = computeFloatingPosition(
      {
        x: 800,
        y: 100,
        width: 120,
        height: 40,
        top: 100,
        left: 800,
        right: 920,
        bottom: 140,
        toJSON: () => ({}),
      },
      {
        placement: "bottom-end",
        offset: 8,
        matchWidth: false,
        floatingWidth: 176,
      }
    );

    expect(result.left).toBe(744);
  });
});
