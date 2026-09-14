"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { createClient } from "@/app/lib/supabase/client";
import {
  disablePushNotifications,
  enablePushNotifications,
} from "@/app/lib/notifications/push";

const copy = {
  en: {
    title: "Reminder notifications",
    description: "Get browser notifications for training, vaccination, dental, farrier, medication, vet and custom reminders.",
    enable: "Enable notifications",
    disable: "Disable notifications",
    enabled: "Notifications are enabled on this device.",
    disabled: "Notifications are currently disabled.",
    unsupported: "This browser does not support push notifications.",
    working: "Please wait…",
    error: "Could not update notification settings.",
  },
  de: {
    title: "Erinnerungsbenachrichtigungen",
    description: "Erhalte Browser-Benachrichtigungen für Training, Impfungen, Zahnbehandlung, Hufschmied, Medikamente, Tierarzt und eigene Erinnerungen.",
    enable: "Benachrichtigungen aktivieren",
    disable: "Benachrichtigungen deaktivieren",
    enabled: "Benachrichtigungen sind auf diesem Gerät aktiviert.",
    disabled: "Benachrichtigungen sind derzeit deaktiviert.",
    unsupported: "Dieser Browser unterstützt keine Push-Benachrichtigungen.",
    working: "Bitte warten …",
    error: "Die Benachrichtigungseinstellungen konnten nicht geändert werden.",
  },
  fr: {
    title: "Notifications de rappel",
    description: "Recevez des notifications du navigateur pour l'entraînement, les vaccins, les soins dentaires, le maréchal-ferrant, les médicaments, le vétérinaire et vos rappels personnalisés.",
    enable: "Activer les notifications",
    disable: "Désactiver les notifications",
    enabled: "Les notifications sont activées sur cet appareil.",
    disabled: "Les notifications sont actuellement désactivées.",
    unsupported: "Ce navigateur ne prend pas en charge les notifications push.",
    working: "Veuillez patienter…",
    error: "Impossible de modifier les paramètres de notification.",
  },
  nl: {
    title: "Herinneringsmeldingen",
    description: "Ontvang browsermeldingen voor training, vaccinaties, gebitsverzorging, hoefsmid, medicatie, dierenarts en aangepaste herinneringen.",
    enable: "Meldingen inschakelen",
    disable: "Meldingen uitschakelen",
    enabled: "Meldingen zijn ingeschakeld op dit apparaat.",
    disabled: "Meldingen zijn momenteel uitgeschakeld.",
    unsupported: "Deze browser ondersteunt geen pushmeldingen.",
    working: "Even geduld…",
    error: "De meldingsinstellingen konden niet worden gewijzigd.",
  },
  es: {
    title: "Notificaciones de recordatorios",
    description: "Recibe notificaciones del navegador para entrenamiento, vacunas, cuidado dental, herrador, medicación, veterinario y recordatorios personalizados.",
    enable: "Activar notificaciones",
    disable: "Desactivar notificaciones",
    enabled: "Las notificaciones están activadas en este dispositivo.",
    disabled: "Las notificaciones están desactivadas actualmente.",
    unsupported: "Este navegador no admite notificaciones push.",
    working: "Espera…",
    error: "No se pudieron actualizar los ajustes de notificaciones.",
  },
} as const;

type Locale = keyof typeof copy;

type Props = { userId: string };

export default function NotificationSettings({ userId }: Props) {
  const locale = useLocale() as Locale;
  const t = copy[locale] ?? copy.en;
  const [enabled, setEnabled] = useState(false);
  const [supported, setSupported] = useState(true);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (active) {
          setSupported(false);
          setBusy(false);
        }
        return;
      }
      try {
        const registration = await navigator.serviceWorker.getRegistration("/");
        const subscription = await registration?.pushManager.getSubscription();
        if (active) setEnabled(Boolean(subscription));
      } finally {
        if (active) setBusy(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [userId]);

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      if (enabled) {
        await disablePushNotifications();
        setEnabled(false);
      } else {
        const result = await enablePushNotifications();
        setSupported(result.supported);
        if (!result.enabled) throw new Error(result.reason ?? t.error);
        setEnabled(true);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl border border-blue-500/20 bg-[#111827] p-6 sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[4px] text-blue-400">Notifications</p>
          <h2 className="mt-3 text-xl font-bold text-white">{t.title}</h2>
          <p className="mt-2 text-sm leading-6 text-gray-400">{t.description}</p>
          <p className="mt-3 text-sm text-gray-300">
            {supported ? (enabled ? t.enabled : t.disabled) : t.unsupported}
          </p>
          {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
        </div>
        <button
          type="button"
          onClick={toggle}
          disabled={busy || !supported}
          className="shrink-0 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? t.working : enabled ? t.disable : t.enable}
        </button>
      </div>
    </section>
  );
}
