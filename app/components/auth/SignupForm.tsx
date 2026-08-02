"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import AuthFormShell, {
  authInputClassName,
  authLabelClassName,
} from "@/app/components/auth/AuthFormShell";
import {
  getAuthErrorMessage,
  validateSignupForm,
} from "@/app/lib/auth-validation";
import { createClient } from "@/app/lib/supabase/client";
import { loginRedirectPath } from "@/app/lib/auth/paths";
import { getSupabaseEnv } from "@/app/lib/supabase/env";

export default function SignupForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/account";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const validationErrors = validateSignupForm(
      fullName,
      email,
      password,
      confirmPassword
    );
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    if (!getSupabaseEnv().isConfigured) {
      setFormError(t("login.authNotConfigured"));
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        setFormError(t(`errors.${getAuthErrorMessage(error.message)}`));
        return;
      }

      if (data.user && data.user.identities?.length === 0) {
        setFormError(t("signup.accountExists"));
        return;
      }

      if (data.session) {
        router.push(nextPath);
        router.refresh();
        return;
      }

      setSuccessMessage(t("signup.accountCreated"));
    } catch {
      setFormError(t("signup.genericError"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthFormShell
      title={t("signup.title")}
      subtitle={t("signup.subtitle")}
      footerText={t("signup.footerText")}
      footerHref={loginRedirectPath(nextPath !== "/account" ? nextPath : undefined)}
      footerLinkLabel={t("signup.footerLink")}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="fullName" className={authLabelClassName}>
            {t("signup.fullName")}
          </label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={authInputClassName}
            placeholder={t("signup.fullNamePlaceholder")}
          />
          {fieldErrors.fullName ? (
            <p className="mt-2 text-sm text-red-400">
              {t(`validation.${fieldErrors.fullName}`)}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="signup-email" className={authLabelClassName}>
            {t("signup.email")}
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputClassName}
            placeholder={t("signup.emailPlaceholder")}
          />
          {fieldErrors.email ? (
            <p className="mt-2 text-sm text-red-400">
              {t(`validation.${fieldErrors.email}`)}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="signup-password" className={authLabelClassName}>
            {t("signup.password")}
          </label>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClassName}
            placeholder={t("signup.passwordPlaceholder")}
          />
          {fieldErrors.password ? (
            <p className="mt-2 text-sm text-red-400">
              {t(`validation.${fieldErrors.password}`)}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="confirmPassword" className={authLabelClassName}>
            {t("signup.confirmPassword")}
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={authInputClassName}
            placeholder={t("signup.confirmPasswordPlaceholder")}
          />
          {fieldErrors.confirmPassword ? (
            <p className="mt-2 text-sm text-red-400">
              {t(`validation.${fieldErrors.confirmPassword}`)}
            </p>
          ) : null}
        </div>

        {formError ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {formError}
          </div>
        ) : null}

        {successMessage ? (
          <div className="rounded-2xl border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-sm text-blue-200">
            {successMessage}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed px-6 py-4 text-white font-semibold transition"
        >
          {isLoading ? t("signup.submitting") : t("signup.submit")}
        </button>
      </form>
    </AuthFormShell>
  );
}
