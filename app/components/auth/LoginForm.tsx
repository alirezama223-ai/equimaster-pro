"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import AuthFormShell, {
  authInputClassName,
  authLabelClassName,
} from "@/app/components/auth/AuthFormShell";
import PasswordInput from "@/app/components/auth/PasswordInput";
import TurnstileWidget, {
  type TurnstileWidgetHandle,
} from "@/app/components/auth/TurnstileWidget";
import {
  getAuthErrorMessage,
  validateLoginForm,
} from "@/app/lib/auth-validation";
import { createClient } from "@/app/lib/supabase/client";
import { getSupabaseEnv } from "@/app/lib/supabase/env";
import { completePostAuthRedirect } from "@/app/lib/auth/complete-post-auth";
import AuthSessionResume from "@/app/components/auth/AuthSessionResume";
import { getSafeNextPath } from "@/app/lib/auth/paths";
import type { AppLocale } from "@/i18n/routing";

export default function LoginForm() {
  const t = useTranslations("auth");
  const locale = useLocale() as AppLocale;
  const searchParams = useSearchParams();
  const nextPath = getSafeNextPath(searchParams.get("next"));
  const callbackError = searchParams.get("error");
  const resetSuccess = searchParams.get("reset") === "success";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<TurnstileWidgetHandle>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(
    callbackError === "auth_callback_failed"
      ? t("login.callbackFailed")
      : callbackError === "supabase_not_configured"
        ? t("login.supabaseNotConfigured")
        : null
  );
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const validationErrors = validateLoginForm(email, password);
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    if (!getSupabaseEnv().isConfigured) {
      setFormError(t("login.authNotConfigured"));
      return;
    }

    if (!captchaToken) {
      setFormError(t("login.genericError"));
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
        options: { captchaToken },
      });

      if (error) {
        setFormError(t(`errors.${getAuthErrorMessage(error.message)}`));
        return;
      }

      const redirected = await completePostAuthRedirect(
        supabase,
        nextPath,
        locale
      );

      if (!redirected) {
        setFormError(t("login.genericError"));
      }
    } catch {
      setFormError(t("login.genericError"));
    } finally {
      captchaRef.current?.reset();
      setCaptchaToken(null);
      setIsLoading(false);
    }
  }

  return (
    <AuthFormShell
      title={t("login.title")}
      subtitle={t("login.subtitle")}
      footerText={t("login.footerText")}
      footerHref={`/signup${nextPath !== "/account" ? `?next=${encodeURIComponent(nextPath)}` : ""}`}
      footerLinkLabel={t("login.footerLink")}
    >
      <AuthSessionResume nextPath={nextPath} />
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className={authLabelClassName}>
            {t("login.email")}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputClassName}
            placeholder={t("login.emailPlaceholder")}
          />
          {fieldErrors.email ? (
            <p className="mt-2 text-sm text-red-400">
              {t(`validation.${fieldErrors.email}`)}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="password" className={authLabelClassName}>
            {t("login.password")}
          </label>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("login.passwordPlaceholder")}
          />
          {fieldErrors.password ? (
            <p className="mt-2 text-sm text-red-400">
              {t(`validation.${fieldErrors.password}`)}
            </p>
          ) : null}
          <p className="mt-3 text-right">
            <Link
              href="/forgot-password"
              className="inline-flex min-h-11 items-center text-sm font-semibold text-blue-400 hover:text-blue-300"
            >
              {t("login.forgotPasswordLink")}
            </Link>
          </p>
        </div>

        <TurnstileWidget
          ref={captchaRef}
          action="login"
          onToken={setCaptchaToken}
        />

        {resetSuccess ? (
          <div className="rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-200">
            {t("login.passwordResetSuccess")}
          </div>
        ) : null}

        {formError ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {formError}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isLoading || !captchaToken}
          className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed px-6 py-4 text-white font-semibold transition"
        >
          {isLoading ? t("login.submitting") : t("login.submit")}
        </button>
      </form>
    </AuthFormShell>
  );
}
