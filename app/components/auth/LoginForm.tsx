"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthFormShell, {
  authInputClassName,
  authLabelClassName,
} from "@/app/components/auth/AuthFormShell";
import {
  getAuthErrorMessage,
  validateLoginForm,
} from "@/app/lib/auth-validation";
import { createClient } from "@/app/lib/supabase/client";
import { getSupabaseEnv } from "@/app/lib/supabase/env";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/account";
  const callbackError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [formError, setFormError] = useState<string | null>(
    callbackError === "auth_callback_failed"
      ? "Email confirmation failed. Please try signing in again."
      : callbackError === "supabase_not_configured"
        ? "Supabase is not configured yet. Add your environment variables to enable authentication."
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
      setFormError(
        "Authentication is not configured. Check your Supabase environment variables."
      );
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setFormError(getAuthErrorMessage(error.message));
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch {
      setFormError("Unable to sign in right now. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthFormShell
      title="Welcome Back"
      subtitle="Sign in to manage your account and create premium horse listings."
      footerText="Don't have an account?"
      footerHref={`/signup${nextPath !== "/account" ? `?next=${encodeURIComponent(nextPath)}` : ""}`}
      footerLinkLabel="Create one"
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className={authLabelClassName}>
            Email
          </label>
          <input
            id="email"
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
          <label htmlFor="password" className={authLabelClassName}>
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={authInputClassName}
            placeholder="Enter your password"
          />
          {fieldErrors.password ? (
            <p className="mt-2 text-sm text-red-400">{fieldErrors.password}</p>
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
          className="w-full rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed px-6 py-4 text-white font-semibold transition"
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </AuthFormShell>
  );
}
