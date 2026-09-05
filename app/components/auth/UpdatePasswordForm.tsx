"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import AuthFormShell, {
  authInputClassName,
  authLabelClassName,
} from "@/app/components/auth/AuthFormShell";
import PasswordInput from "@/app/components/auth/PasswordInput";
import {
  getAuthErrorMessage,
  validateUpdatePasswordForm,
} from "@/app/lib/auth-validation";
import { isPasswordRecoveryContext } from "@/app/lib/auth/password-reset";
import { createClient } from "@/app/lib/supabase/client";
import { getSupabaseEnv } from "@/app/lib/supabase/env";

type RecoveryState = "checking" | "ready" | "invalid";

export default function UpdatePasswordForm() {
  const t = useTranslations("auth");
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    password?: string;
    confirmPassword?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [recoveryState, setRecoveryState] = useState<RecoveryState>("checking");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!getSupabaseEnv().isConfigured) {
      setRecoveryState("invalid");
      return;
    }

    const supabase = createClient();
    let recoveryDetected = isPasswordRecoveryContext(
      new URLSearchParams(searchParams.toString()),
      new URLSearchParams(window.location.hash.replace(/^#/, ""))
    );

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        recoveryDetected = true;
        setRecoveryState("ready");
      }
    });

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && recoveryDetected) {
        setRecoveryState("ready");
        return;
      }

      if (session && !recoveryDetected) {
        setRecoveryState("invalid");
        return;
      }

      setRecoveryState("invalid");
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [searchParams]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    const validationErrors = validateUpdatePasswordForm(password, confirmPassword);
    setFieldErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    if (recoveryState !== "ready") {
      setFormError(t("updatePassword.sessionExpired"));
      return;
    }

    if (!getSupabaseEnv().isConfigured) {
      setFormError(t("updatePassword.genericError"));
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setFormError(t(`errors.${getAuthErrorMessage(error.message)}`));
        return;
      }

      try {
        await fetch("/api/security/audit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventType: "auth.password_change.success" }),
          keepalive: true,
        });
      } catch (auditError) {
        console.warn("[security-audit] Password change audit request failed:", auditError);
      }

      await supabase.auth.signOut();
      router.push("/login?reset=success");
    } catch {
      setFormError(t("updatePassword.genericError"));
    } finally {
      setIsLoading(false);
    }
  }

  if (recoveryState === "checking") {
    return (
      <AuthFormShell
        title={t("updatePassword.title")}
        subtitle={t("updatePassword.subtitle")}
        footerText={t("updatePassword.footerText")}
        footerHref="/login"
        footerLinkLabel={t("updatePassword.footerLink")}
      >
        <div className="rounded-2xl border border-gray-700 bg-[#08111F] px-4 py-6 text-center text-sm text-gray-400">
          {t("updatePassword.loading")}
        </div>
      </AuthFormShell>
    );
  }

  if (recoveryState === "invalid") {
    return (
      <AuthFormShell
        title={t("updatePassword.title")}
        subtitle={t("updatePassword.subtitle")}
        footerText={t("updatePassword.footerText")}
        footerHref="/login"
        footerLinkLabel={t("updatePassword.footerLink")}
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {t("updatePassword.sessionExpired")}
          </div>
          <Link
            href="/forgot-password"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-4 font-semibold text-white transition hover:bg-blue-500"
          >
            {t("updatePassword.requestNewLink")}
          </Link>
        </div>
      </AuthFormShell>
    );
  }

  return (
    <AuthFormShell
      title={t("updatePassword.title")}
      subtitle={t("updatePassword.subtitle")}
      footerText={t("updatePassword.footerText")}
      footerHref="/login"
      footerLinkLabel={t("updatePassword.footerLink")}
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="new-password" className={authLabelClassName}>
            {t("updatePassword.password")}
          </label>
          <PasswordInput
            id="new-password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("updatePassword.passwordPlaceholder")}
          />
          {fieldErrors.password ? (
            <p className="mt-2 text-sm text-red-400">
              {t(`validation.${fieldErrors.password}`)}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="confirm-new-password" className={authLabelClassName}>
            {t("updatePassword.confirmPassword")}
          </label>
          <PasswordInput
            id="confirm-new-password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t("updatePassword.confirmPasswordPlaceholder")}
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

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60 px-6 py-4 font-semibold text-white transition"
        >
          {isLoading ? t("updatePassword.submitting") : t("updatePassword.submit")}
        </button>
      </form>
    </AuthFormShell>
  );
}
