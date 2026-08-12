import { describe, expect, it } from "vitest";
import {
  validateForgotPasswordForm,
  validateUpdatePasswordForm,
} from "@/app/lib/auth-validation";

describe("validateForgotPasswordForm", () => {
  it("requires email", () => {
    expect(validateForgotPasswordForm("")).toEqual({ email: "emailRequired" });
  });

  it("rejects invalid email", () => {
    expect(validateForgotPasswordForm("not-an-email")).toEqual({
      email: "emailInvalid",
    });
  });

  it("accepts valid email", () => {
    expect(validateForgotPasswordForm("user@example.com")).toEqual({});
  });
});

describe("validateUpdatePasswordForm", () => {
  it("requires password and confirmation", () => {
    expect(validateUpdatePasswordForm("", "")).toEqual({
      password: "passwordRequired",
      confirmPassword: "confirmPasswordRequired",
    });
  });

  it("enforces minimum password length", () => {
    expect(validateUpdatePasswordForm("short", "short")).toEqual({
      password: "passwordMinLength",
    });
  });

  it("rejects mismatched confirmation", () => {
    expect(validateUpdatePasswordForm("password123", "password124")).toEqual({
      confirmPassword: "passwordsMismatch",
    });
  });

  it("accepts matching passwords of at least 8 characters", () => {
    expect(validateUpdatePasswordForm("password123", "password123")).toEqual({});
  });
});
