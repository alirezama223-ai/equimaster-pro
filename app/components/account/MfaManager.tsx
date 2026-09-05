"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/app/lib/supabase/client";

export default function MfaManager() {
  const t = useTranslations("auth.mfa");
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/account";
  const supabase = createClient();

  const [factorId, setFactorId] = useState<string | null>(null);
  const [factorName, setFactorName] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [needsChallenge, setNeedsChallenge] = useState(false);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadFactors() {
    setIsLoading(true);
    setError(null);

    const { data, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError) {
      setError(factorsError.message);
      setIsLoading(false);
      return;
    }

    const verifiedTotp = data.totp.find((factor) => factor.status === "verified");
    setFactorId(verifiedTotp?.id ?? null);
    setFactorName(verifiedTotp?.friendly_name ?? null);

    const { data: assurance, error: assuranceError } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assuranceError) {
      setError(assuranceError.message);
    } else if (assurance) {
      setNeedsChallenge(assurance.currentLevel === "aal1" && assurance.nextLevel === "aal2");
    } else {
      setNeedsChallenge(false);
    }

    setIsLoading(false);
  }

  useEffect(() => {
    void loadFactors();
  }, []);

  async function startEnrollment() {
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    // A previous interrupted enrollment can leave an unverified factor behind.
    // Remove only the stale factor with our known friendly name so a fresh QR
    // code can be generated without creating duplicate factors.
    const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
    if (factorsError) {
      setError(factorsError.message);
      setIsSubmitting(false);
      return;
    }

    const staleFactor = factors.totp.find(
      (factor) =>
        factor.status === "unverified" && factor.friendly_name === "Shabdiz Authenticator",
    );

    if (staleFactor) {
      const { error: cleanupError } = await supabase.auth.mfa.unenroll({
        factorId: staleFactor.id,
      });
      if (cleanupError) {
        setError(cleanupError.message);
        setIsSubmitting(false);
        return;
      }
    }

    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Shabdiz Authenticator",
    });

    setIsSubmitting(false);

    if (enrollError || !data) {
      setError(enrollError?.message ?? t("genericError"));
      return;
    }

    setFactorId(data.id);
    setFactorName(data.friendly_name ?? "Shabdiz Authenticator");
    setQrCode(data.totp.qr_code);
    setIsEnrolling(true);
    setCode("");
  }

  async function verifyFactor(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!factorId || code.length !== 6) return;

    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const challenge = await supabase.auth.mfa.challenge({ factorId });
    if (challenge.error) {
      setError(challenge.error.message);
      setIsSubmitting(false);
      return;
    }

    const verification = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.data.id,
      code,
    });

    setIsSubmitting(false);

    if (verification.error) {
      setError(verification.error.message);
      return;
    }

    await fetch("/api/security/audit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        eventType: isEnrolling ? "auth.mfa.enroll.success" : "auth.mfa.verify.success",
      }),
      keepalive: true,
    }).catch(() => undefined);

    if (isEnrolling) {
      setIsEnrolling(false);
      setQrCode(null);
      setMessage(t("enabled"));
    } else {
      setNeedsChallenge(false);
      window.location.replace(nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/account");
      return;
    }

    setCode("");
    await loadFactors();
  }

  async function unenroll() {
    if (!factorId) return;

    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const { error: unenrollError } = await supabase.auth.mfa.unenroll({ factorId });
    if (unenrollError) {
      setError(unenrollError.message);
      setIsSubmitting(false);
      return;
    }

    await supabase.auth.refreshSession();

    await fetch("/api/security/audit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventType: "auth.mfa.unenroll.success" }),
      keepalive: true,
    }).catch(() => undefined);

    setFactorId(null);
    setFactorName(null);
    setNeedsChallenge(false);
    setIsSubmitting(false);
    setMessage(t("disabled"));
  }

  if (isLoading) {
    return <p className="text-gray-400">{t("loading")}</p>;
  }

  if (needsChallenge && factorId) {
    return (
      <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 sm:p-8">
        <p className="text-xs uppercase tracking-[4px] text-blue-400 font-semibold">{t("eyebrow")}</p>
        <h1 className="mt-3 text-2xl font-black text-white">{t("verifyTitle")}</h1>
        <p className="mt-2 text-gray-400">{t("verifySubtitle")}</p>
        <form onSubmit={verifyFactor} className="mt-6 space-y-4">
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            className="w-full rounded-xl border border-white/10 bg-[#0B1422] px-4 py-4 text-center text-2xl tracking-[0.5em] text-white outline-none focus:border-blue-500"
            placeholder="000000"
            aria-label={t("code")}
          />
          {error ? <p className="text-sm text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting || code.length !== 6}
            className="w-full rounded-xl bg-blue-600 px-6 py-4 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? t("verifying") : t("verify")}
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 sm:p-8">
      <p className="text-xs uppercase tracking-[4px] text-blue-400 font-semibold">{t("eyebrow")}</p>
      <h1 className="mt-3 text-2xl font-black text-white">{t("title")}</h1>
      <p className="mt-2 text-gray-400">{t("subtitle")}</p>

      {message ? (
        <div className="mt-5 rounded-2xl border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-200">
          {message}
        </div>
      ) : null}
      {error ? <p className="mt-5 text-sm text-red-400">{error}</p> : null}

      {isEnrolling && qrCode ? (
        <div className="mt-6 space-y-5">
          <p className="text-sm text-gray-300">{t("scan")}</p>
          <div className="flex justify-center rounded-2xl bg-white p-5">
            <img
              src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(qrCode)}`}
              alt={t("qrAlt")}
              className="h-56 w-56"
            />
          </div>
          <p className="text-sm text-gray-400">{t("enterCode")}</p>
          <form onSubmit={verifyFactor} className="space-y-4">
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full rounded-xl border border-white/10 bg-[#0B1422] px-4 py-4 text-center text-2xl tracking-[0.5em] text-white outline-none focus:border-blue-500"
              placeholder="000000"
              aria-label={t("code")}
            />
            <button
              type="submit"
              disabled={isSubmitting || code.length !== 6}
              className="w-full rounded-xl bg-blue-600 px-6 py-4 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? t("verifying") : t("enable")}
            </button>
          </form>
        </div>
      ) : factorId ? (
        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-green-500/20 bg-green-500/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-semibold text-green-200">{t("active")}</p>
            <p className="mt-1 text-sm text-gray-400">{factorName || t("authenticator")}</p>
          </div>
          <button
            type="button"
            onClick={unenroll}
            disabled={isSubmitting}
            className="rounded-xl border border-red-500/30 px-5 py-3 font-semibold text-red-300 transition hover:bg-red-500/10 disabled:opacity-50"
          >
            {isSubmitting ? t("working") : t("disable")}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={startEnrollment}
          disabled={isSubmitting}
          className="mt-6 rounded-xl bg-blue-600 px-6 py-4 font-semibold text-white transition hover:bg-blue-500 disabled:opacity-50"
        >
          {isSubmitting ? t("working") : t("enable")}
        </button>
      )}
    </section>
  );
}
