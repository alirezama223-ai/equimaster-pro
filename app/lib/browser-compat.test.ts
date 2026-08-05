import { afterEach, describe, expect, it, vi } from "vitest";
import { copyTextToClipboard } from "@/app/lib/browser-compat";

describe("copyTextToClipboard", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the Clipboard API when available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("window", {});
    vi.stubGlobal("navigator", { clipboard: { writeText } });

    const ok = await copyTextToClipboard("https://equimaster.pro/horses/test");

    expect(ok).toBe(true);
    expect(writeText).toHaveBeenCalledWith("https://equimaster.pro/horses/test");
  });

  it("falls back to execCommand when Clipboard API fails", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    const execCommand = vi.fn().mockReturnValue(true);
    const appendChild = vi.fn();
    const removeChild = vi.fn();
    const textarea = {
      value: "",
      style: {} as CSSStyleDeclaration,
      setAttribute: vi.fn(),
      focus: vi.fn(),
      select: vi.fn(),
    };

    vi.stubGlobal("window", {});
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    vi.stubGlobal("document", {
      createElement: vi.fn(() => textarea),
      execCommand,
      body: { appendChild, removeChild },
    });

    const ok = await copyTextToClipboard("copy-me");

    expect(ok).toBe(true);
    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(appendChild).toHaveBeenCalledWith(textarea);
    expect(removeChild).toHaveBeenCalledWith(textarea);
  });
});
