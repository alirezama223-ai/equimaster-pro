"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import AuthFormShell, {
  authInputClassName,
  authLabelClassName,
} from "@/app/components/auth/AuthFormShell";
import TurnstileWidget, {
  type TurnstileWidgetHandle,
} from "@/app/components/auth/TurnstileWidget";
import { validateForgotPasswordForm } from "@/app/lib/auth-validation";
import { buildPasswordResetCallbackUrl } from "@/app/lib/auth/password-reset";
import { createClient } from "@/app/lib/supabase/client";
import { getSupabaseEnv } from "@/app/lib/supabase/env";

export default function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<TurnstileWidgetHandle>(null);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string }>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage(null);

    const validationErrors = validateForgotPasswordForm(email);
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    if (!getSupabaseEnv().isConfigured) {
      setSuccessMessage(t("forgotPassword.success"));
      return;
    }

    if (!captchaToken) {
      setSuccessMessage(t("forgotPassword.success"));
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: buildPasswordResetCallbackUrl(window.location.origin),
        captchaToken,
      });
    } catch {
      // Do not reveal whether the email exists.
    } finally {
      captchaRef.current?.reset();
      setCaptchaToken(null);
      setIsLoading(false);
      setSuccessMessage(t("forgotPassword.success"));
    }
  }

  return (
    <AuthFormShell
      title={t("forgotPassword.title")}
      subtitle={t("forgotPassword.subtitle")}
      footerText={t("forgotPassword.footerText")}
      footerHref="/login"
      footerLinkLabel={t("forgotPassword.footerLink")}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="forgot-email" className={authLabelClassName}>
            {t("forgotPassword.email")}
          </label>
          <input
            id="forgot-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputClassName}
            placeholder={t("forgotPassword.emailPlaceholder")}
          />
          {fieldErrors.email ? (
            <p className="mt-2 text-sm text-red-400">
              {t(`validation.${fieldErrors.email}`)}
            </p>
          ) : null}
        </div>

        <TurnstileWidget
          ref={captchaRef}
          action="password_reset"
          onToken={setCaptchaToken}
        />

        {successMessage ? (
          <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
            {successMessage}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isLoading || !captchaToken}
          className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 px-6 py-4 font-semibold text-white transition"
        >
          {isLoading ? t("forgotPassword.submitting") : t("forgotPassword.submit")}
        </button>
      </form>
    </AuthFormShell>
  );
}
