"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useState, useTransition } from "react";
import { resetDemo, setDemoMode } from "@/app/actions/demo";
import type { DemoEnvironmentSnapshot } from "@/app/types/demo";

type Props = {
  snapshot: DemoEnvironmentSnapshot;
};

export default function DemoEnvironmentPanel({ snapshot }: Props) {
  const t = useTranslations("account.demo");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { organization, userState, demoHorses } = snapshot;

  const roleLabels: Record<string, string> = {
    owner: t("roles.owner"),
    trainer: t("roles.trainer"),
    vet: t("roles.vet"),
    farrier: t("roles.farrier"),
  };

  function handleToggleDemoMode() {
    setError(null);
    startTransition(async () => {
      const result = await setDemoMode(!userState.demoModeEnabled);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleResetDemo() {
    setError(null);
    startTransition(async () => {
      const result = await resetDemo();
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const lastResetLabel = userState.lastResetAt
    ? new Date(userState.lastResetAt).toLocaleString(locale, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <section className="rounded-3xl bg-[#111C2E] border border-gray-800 p-6 sm:p-8 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="uppercase tracking-[6px] text-emerald-500 text-xs font-semibold">
            {t("eyebrow")}
          </p>
          <h2 className="text-2xl font-black text-white mt-3">
            {organization?.name ?? t("defaultOrgName")}
          </h2>
          <p className="mt-3 text-gray-400 max-w-2xl">
            {organization?.description ?? t("defaultDescription")}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:items-end">
          <button
            type="button"
            onClick={handleToggleDemoMode}
            disabled={isPending}
            aria-pressed={userState.demoModeEnabled}
            className={`inline-flex items-center gap-3 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:opacity-60 ${
              userState.demoModeEnabled
                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                : "border border-white/20 text-white hover:bg-white/5"
            }`}
          >
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                userState.demoModeEnabled ? "bg-white" : "bg-gray-500"
              }`}
            />
            {userState.demoModeEnabled ? t("modeOn") : t("modeOff")}
          </button>

          <button
            type="button"
            onClick={handleResetDemo}
            disabled={isPending}
            className="inline-flex justify-center rounded-xl border border-amber-500/40 bg-amber-500/10 px-5 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/20 disabled:opacity-60"
          >
            {isPending ? t("working") : t("resetData")}
          </button>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      {userState.demoModeEnabled ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-100">
          {t("enabledNotice")}
        </div>
      ) : null}

      {lastResetLabel ? (
        <p className="text-xs text-gray-500">{t("lastReset", { date: lastResetLabel })}</p>
      ) : null}

      {organization?.members.length ? (
        <div>
          <h3 className="text-sm uppercase tracking-[0.16em] text-gray-500">{t("demoTeam")}</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {organization.members.map((member) => (
              <div
                key={member.id}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <p className="text-xs uppercase tracking-[0.14em] text-blue-300">
                  {roleLabels[member.role] ?? member.role}
                </p>
                <p className="mt-1 font-semibold text-white">{member.displayName}</p>
                <p className="text-sm text-gray-400">{member.title}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm uppercase tracking-[0.16em] text-gray-500">{t("demoHorses")}</h3>
          {userState.demoModeEnabled ? (
            <Link href="/training/analytics" className="text-sm text-blue-300 hover:text-blue-200">
              {t("openAnalytics")}
            </Link>
          ) : null}
        </div>

        {demoHorses.length > 0 ? (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {demoHorses.map((horse) => (
              <li
                key={horse.id}
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
              >
                <p className="font-semibold text-white">{horse.name}</p>
                <p className="text-sm text-gray-400">{horse.discipline}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-gray-400">
            {userState.demoModeEnabled ? t("seedingUnavailable") : t("enableToSeed")}
          </p>
        )}
      </div>
    </section>
  );
}
