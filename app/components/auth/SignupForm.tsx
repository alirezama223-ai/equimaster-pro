"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthFormShell, {
  authInputClassName,
  authLabelClassName,
} from "@/app/components/auth/AuthFormShell";
import {
  getAuthErrorMessage,
  validateSignupForm,
} from "@/app/lib/auth-validation";
import { createClient } from "@/app/lib/supabase/client";
import { getSupabaseEnv } from "@/app/lib/supabase/env";

export default function SignupForm() {
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
      setFormError(
        "Authentication is not configured. Check your Supabase environment variables."
      );
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
        setFormError(getAuthErrorMessage(error.message));
        return;
      }

      if (data.user && data.user.identities?.length === 0) {
        setFormError("An account with this email already exists.");
        return;
      }

      if (data.session) {
        router.push(nextPath);
        router.refresh();
        return;
      }

      setSuccessMessage(
        "Account created. Please check your email to confirm your address before signing in."
      );
    } catch {
      setFormError("Unable to create your account right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthFormShell
      title="Create Account"
      subtitle="Join EquiMaster Pro to list sport horses and manage your seller profile."
      footerText="Already have an account?"
      footerHref={`/login${nextPath !== "/account" ? `?next=${encodeURIComponent(nextPath)}` : ""}`}
      footerLinkLabel="Sign in"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="fullName" className={authLabelClassName}>
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={authInputClassName}
            placeholder="Your full name"
          />
          {fieldErrors.fullName ? (
            <p className="mt-2 text-sm text-red-400">{fieldErrors.fullName}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="signup-email" className={authLabelClassName}>
            Email
          </label>
          <input
            id="signup-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={authInputClassName}
            placeholder="you@example.com"
          />
          {fieldErrors.email ? (
            <p className="mt-2 text-sm text-red-400">{fieldErrors.email}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="signup-password" className={authLabelClassName}>
            Password
          </label>
          <input
            id="signup-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClassName}
            placeholder="Minimum 8 characters"
          />
          {fieldErrors.password ? (
            <p className="mt-2 text-sm text-red-400">{fieldErrors.password}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="confirmPassword" className={authLabelClassName}>
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={authInputClassName}
            placeholder="Re-enter your password"
          />
          {fieldErrors.confirmPassword ? (
            <p className="mt-2 text-sm text-red-400">{fieldErrors.confirmPassword}</p>
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
          {isLoading ? "Creating account..." : "Create Account"}
        </button>
      </form>
    </AuthFormShell>
  );
}
