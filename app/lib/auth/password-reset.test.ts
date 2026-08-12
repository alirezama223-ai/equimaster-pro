import { describe, expect, it } from "vitest";
import {
  AUTH_CALLBACK_PATH,
  UPDATE_PASSWORD_PATH,
  getSafeNextPath,
} from "@/app/lib/auth/paths";
import {
  appendPasswordRecoveryParam,
  buildPasswordResetCallbackUrl,
  isPasswordRecoveryContext,
} from "@/app/lib/auth/password-reset";

describe("getSafeNextPath", () => {
  it("allows update-password as a safe internal next path", () => {
    expect(getSafeNextPath(UPDATE_PASSWORD_PATH)).toBe(UPDATE_PASSWORD_PATH);
  });

  it("blocks external and protocol-relative redirects", () => {
    expect(getSafeNextPath("https://evil.example")).toBe("/account");
    expect(getSafeNextPath("//evil.example")).toBe("/account");
  });

  it("redirects login and signup next paths to account", () => {
    expect(getSafeNextPath("/login")).toBe("/account");
    expect(getSafeNextPath("/signup")).toBe("/account");
  });
});

describe("buildPasswordResetCallbackUrl", () => {
  it("uses the auth callback with a safe update-password next path", () => {
    expect(buildPasswordResetCallbackUrl("https://equimaster-pro.vercel.app")).toBe(
      `https://equimaster-pro.vercel.app${AUTH_CALLBACK_PATH}?next=${encodeURIComponent(UPDATE_PASSWORD_PATH)}`
    );
  });
});

describe("isPasswordRecoveryContext", () => {
  it("detects recovery query param", () => {
    expect(
      isPasswordRecoveryContext(new URLSearchParams("recovery=1"))
    ).toBe(true);
  });

  it("detects recovery hash type", () => {
    expect(
      isPasswordRecoveryContext(
        new URLSearchParams(),
        new URLSearchParams("type=recovery")
      )
    ).toBe(true);
  });

  it("rejects unrelated contexts", () => {
    expect(isPasswordRecoveryContext(new URLSearchParams("reset=success"))).toBe(
      false
    );
  });
});

describe("appendPasswordRecoveryParam", () => {
  it("appends recovery marker to localized paths", () => {
    expect(appendPasswordRecoveryParam("/de/update-password")).toBe(
      "/de/update-password?recovery=1"
    );
  });
});
