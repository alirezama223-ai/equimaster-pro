"use client";

import { useMemo, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { cancelReminder, completeReminder, createReminder } from "@/app/actions/reminders";
import type { ReminderHorseOption, ReminderRow } from "@/app/actions/reminders";

type Props = { reminders: ReminderRow[]; horses: ReminderHorseOption[] };

type LocaleCopy = {
  title: string; subtitle: string; add: string; cancel: string; complete: string; create: string; close: string;
  titleLabel: string; typeLabel: string; horseLabel: string; noHorse: string; dateLabel: string; leadLabel: string;
  repeatLabel: string; never: string; descriptionLabel: string; placeholder: string; empty: string;
  done: string; cancelled: string; sent: string; required: string; error: string; recurring: string;
  types: Record<string, string>; leads: Record<string, string>; repeats: Record<string, string>;
};

const copy: Record<string, LocaleCopy> = {
  en: { title: "Reminders", subtitle: "Keep training, health and care dates in one place.", add: "Add reminder", cancel: "Cancel", complete: "Mark complete", create: "Create reminder", close: "Close", titleLabel: "Title", typeLabel: "Type", horseLabel: "Horse", noHorse: "General reminder", dateLabel: "Date & time", leadLabel: "Remind me before", repeatLabel: "Repeat", never: "Does not repeat", descriptionLabel: "Notes", placeholder: "e.g. Annual vaccination", empty: "No reminders yet.", done: "Completed", cancelled: "Cancelled", sent: "Sent", required: "Please enter a title and date.", error: "Something went wrong.", recurring: "Repeats", types: { training: "Training", vaccination: "Vaccination", dental: "Dental", farrier: "Farrier", medication: "Medication", vet: "Vet", custom: "Custom" }, leads: { "0": "At the time", "5": "5 minutes", "10": "10 minutes", "30": "30 minutes", "60": "1 hour", "1440": "1 day", "2880": "2 days" }, repeats: { "": "Does not repeat", "FREQ=DAILY": "Every day", "FREQ=WEEKLY": "Every week", "FREQ=WEEKLY;INTERVAL=2": "Every 2 weeks", "FREQ=WEEKLY;INTERVAL=4": "Every 4 weeks", "FREQ=WEEKLY;INTERVAL=6": "Every 6 weeks", "FREQ=MONTHLY": "Every month", "FREQ=MONTHLY;INTERVAL=6": "Every 6 months", "FREQ=YEARLY": "Every year" } },
  de: { title: "Erinnerungen", subtitle: "Training, Gesundheit und Pflege an einem Ort verwalten.", add: "Erinnerung hinzufügen", cancel: "Abbrechen", complete: "Als erledigt markieren", create: "Erinnerung erstellen", close: "Schließen", titleLabel: "Titel", typeLabel: "Typ", horseLabel: "Pferd", noHorse: "Allgemeine Erinnerung", dateLabel: "Datum & Uhrzeit", leadLabel: "Vorher erinnern", repeatLabel: "Wiederholung", never: "Keine Wiederholung", descriptionLabel: "Notizen", placeholder: "z. B. Jährliche Impfung", empty: "Noch keine Erinnerungen.", done: "Erledigt", cancelled: "Abgebrochen", sent: "Gesendet", required: "Bitte Titel und Datum eingeben.", error: "Etwas ist schiefgelaufen.", recurring: "Wiederholt sich", types: { training: "Training", vaccination: "Impfung", dental: "Zähne", farrier: "Hufschmied", medication: "Medikament", vet: "Tierarzt", custom: "Eigene" }, leads: { "0": "Zum Zeitpunkt", "5": "5 Minuten", "10": "10 Minuten", "30": "30 Minuten", "60": "1 Stunde", "1440": "1 Tag", "2880": "2 Tage" }, repeats: { "": "Keine Wiederholung", "FREQ=DAILY": "Täglich", "FREQ=WEEKLY": "Wöchentlich", "FREQ=WEEKLY;INTERVAL=2": "Alle 2 Wochen", "FREQ=WEEKLY;INTERVAL=4": "Alle 4 Wochen", "FREQ=WEEKLY;INTERVAL=6": "Alle 6 Wochen", "FREQ=MONTHLY": "Monatlich", "FREQ=MONTHLY;INTERVAL=6": "Alle 6 Monate", "FREQ=YEARLY": "Jährlich" } },
  fr: { title: "Rappels", subtitle: "Gardez les dates d'entraînement, de santé et de soins au même endroit.", add: "Ajouter un rappel", cancel: "Annuler", complete: "Marquer comme terminé", create: "Créer le rappel", close: "Fermer", titleLabel: "Titre", typeLabel: "Type", horseLabel: "Cheval", noHorse: "Rappel général", dateLabel: "Date et heure", leadLabel: "Me prévenir avant", repeatLabel: "Répétition", never: "Ne se répète pas", descriptionLabel: "Notes", placeholder: "ex. Vaccination annuelle", empty: "Aucun rappel pour le moment.", done: "Terminé", cancelled: "Annulé", sent: "Envoyé", required: "Veuillez saisir un titre et une date.", error: "Une erreur est survenue.", recurring: "Répétitif", types: { training: "Entraînement", vaccination: "Vaccination", dental: "Dentaire", farrier: "Maréchal-ferrant", medication: "Médicament", vet: "Vétérinaire", custom: "Personnalisé" }, leads: { "0": "À l'heure", "5": "5 minutes", "10": "10 minutes", "30": "30 minutes", "60": "1 heure", "1440": "1 jour", "2880": "2 jours" }, repeats: { "": "Ne se répète pas", "FREQ=DAILY": "Chaque jour", "FREQ=WEEKLY": "Chaque semaine", "FREQ=WEEKLY;INTERVAL=2": "Toutes les 2 semaines", "FREQ=WEEKLY;INTERVAL=4": "Toutes les 4 semaines", "FREQ=WEEKLY;INTERVAL=6": "Toutes les 6 semaines", "FREQ=MONTHLY": "Chaque mois", "FREQ=MONTHLY;INTERVAL=6": "Tous les 6 mois", "FREQ=YEARLY": "Chaque année" } },
  nl: { title: "Herinneringen", subtitle: "Beheer trainings-, gezondheids- en verzorgingsdata op één plek.", add: "Herinnering toevoegen", cancel: "Annuleren", complete: "Als voltooid markeren", create: "Herinnering maken", close: "Sluiten", titleLabel: "Titel", typeLabel: "Type", horseLabel: "Paard", noHorse: "Algemene herinnering", dateLabel: "Datum en tijd", leadLabel: "Herinner mij vooraf", repeatLabel: "Herhalen", never: "Eenmalig", descriptionLabel: "Notities", placeholder: "bijv. jaarlijkse vaccinatie", empty: "Nog geen herinneringen.", done: "Voltooid", cancelled: "Geannuleerd", sent: "Verzonden", required: "Vul een titel en datum in.", error: "Er ging iets mis.", recurring: "Herhaling", types: { training: "Training", vaccination: "Vaccinatie", dental: "Gebit", farrier: "Hoefsmid", medication: "Medicatie", vet: "Dierenarts", custom: "Aangepast" }, leads: { "0": "Op tijdstip", "5": "5 minuten", "10": "10 minuten", "30": "30 minuten", "60": "1 uur", "1440": "1 dag", "2880": "2 dagen" }, repeats: { "": "Eenmalig", "FREQ=DAILY": "Elke dag", "FREQ=WEEKLY": "Elke week", "FREQ=WEEKLY;INTERVAL=2": "Elke 2 weken", "FREQ=WEEKLY;INTERVAL=4": "Elke 4 weken", "FREQ=WEEKLY;INTERVAL=6": "Elke 6 weken", "FREQ=MONTHLY": "Elke maand", "FREQ=MONTHLY;INTERVAL=6": "Elke 6 maanden", "FREQ=YEARLY": "Elk jaar" } },
  es: { title: "Recordatorios", subtitle: "Gestiona las fechas de entrenamiento, salud y cuidados en un solo lugar.", add: "Añadir recordatorio", cancel: "Cancelar", complete: "Marcar como completado", create: "Crear recordatorio", close: "Cerrar", titleLabel: "Título", typeLabel: "Tipo", horseLabel: "Caballo", noHorse: "Recordatorio general", dateLabel: "Fecha y hora", leadLabel: "Avisarme antes", repeatLabel: "Repetir", never: "No se repite", descriptionLabel: "Notas", placeholder: "p. ej. vacunación anual", empty: "Aún no hay recordatorios.", done: "Completado", cancelled: "Cancelado", sent: "Enviado", required: "Introduce un título y una fecha.", error: "Algo salió mal.", recurring: "Se repite", types: { training: "Entrenamiento", vaccination: "Vacunación", dental: "Dental", farrier: "Herrador", medication: "Medicación", vet: "Veterinario", custom: "Personalizado" }, leads: { "0": "A la hora", "5": "5 minutos", "10": "10 minutos", "30": "30 minutos", "60": "1 hora", "1440": "1 día", "2880": "2 días" }, repeats: { "": "No se repite", "FREQ=DAILY": "Cada día", "FREQ=WEEKLY": "Cada semana", "FREQ=WEEKLY;INTERVAL=2": "Cada 2 semanas", "FREQ=WEEKLY;INTERVAL=4": "Cada 4 semanas", "FREQ=WEEKLY;INTERVAL=6": "Cada 6 semanas", "FREQ=MONTHLY": "Cada mes", "FREQ=MONTHLY;INTERVAL=6": "Cada 6 meses", "FREQ=YEARLY": "Cada año" } },
};

const leadValues = [0, 5, 10, 30, 60, 1440, 2880];
const typeValues = ["training", "vaccination", "dental", "farrier", "medication", "vet", "custom"];
const recurrenceValues = ["", "FREQ=DAILY", "FREQ=WEEKLY", "FREQ=WEEKLY;INTERVAL=2", "FREQ=WEEKLY;INTERVAL=4", "FREQ=WEEKLY;INTERVAL=6", "FREQ=MONTHLY", "FREQ=MONTHLY;INTERVAL=6", "FREQ=YEARLY"];

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

export default function RemindersManager({ reminders, horses }: Props) {
  const router = useRouter();
  const locale = typeof document !== "undefined" ? document.documentElement.lang.split("-")[0] : "en";
  const t = copy[locale] ?? copy.en;
  const [showForm, setShowForm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", reminderType: "training", horseId: "", dueAt: "", remindBeforeMinutes: 10, recurrenceRule: "" });
  const active = useMemo(() => reminders.filter((r) => r.status === "pending" && r.enabled), [reminders]);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setError(null);
    if (!form.title.trim() || !form.dueAt) { setError(t.required); return; }
    setBusy(true);
    const result = await createReminder(form);
    setBusy(false);
    if (result.error) { setError(result.error); return; }
    setForm({ title: "", description: "", reminderType: "training", horseId: "", dueAt: "", remindBeforeMinutes: 10, recurrenceRule: "" });
    setShowForm(false); router.refresh();
  }

  async function action(id: string, kind: "complete" | "cancel") {
    setBusy(true); setError(null);
    const result = kind === "complete" ? await completeReminder(id) : await cancelReminder(id);
    setBusy(false);
    if (result.error) { setError(result.error); return; }
    router.refresh();
  }

  return (
    <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[4px] text-blue-400">EquiMaster</p><h2 className="mt-2 text-2xl font-bold text-white">{t.title}</h2><p className="mt-2 text-sm text-gray-400">{t.subtitle}</p></div>
        {!showForm && <button type="button" onClick={() => setShowForm(true)} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500">{t.add}</button>}
      </div>
      {error && <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
      {showForm && (
        <form onSubmit={submit} className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-black/10 p-5 sm:grid-cols-2">
          <label className="sm:col-span-2"><span className="mb-2 block text-sm font-medium text-gray-200">{t.titleLabel}</span><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={t.placeholder} className="w-full rounded-xl border border-white/10 bg-[#0B1422] px-4 py-3 text-white outline-none focus:border-blue-500" /></label>
          <label><span className="mb-2 block text-sm font-medium text-gray-200">{t.typeLabel}</span><select value={form.reminderType} onChange={(e) => setForm({ ...form, reminderType: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#0B1422] px-4 py-3 text-white">{typeValues.map((type) => <option key={type} value={type}>{t.types[type]}</option>)}</select></label>
          <label><span className="mb-2 block text-sm font-medium text-gray-200">{t.horseLabel}</span><select value={form.horseId} onChange={(e) => setForm({ ...form, horseId: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#0B1422] px-4 py-3 text-white"><option value="">{t.noHorse}</option>{horses.map((horse) => <option key={horse.id} value={horse.id}>{horse.name}</option>)}</select></label>
          <label><span className="mb-2 block text-sm font-medium text-gray-200">{t.dateLabel}</span><input required type="datetime-local" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#0B1422] px-4 py-3 text-white" /></label>
          <label><span className="mb-2 block text-sm font-medium text-gray-200">{t.leadLabel}</span><select value={form.remindBeforeMinutes} onChange={(e) => setForm({ ...form, remindBeforeMinutes: Number(e.target.value) })} className="w-full rounded-xl border border-white/10 bg-[#0B1422] px-4 py-3 text-white">{leadValues.map((value) => <option key={value} value={value}>{t.leads[String(value)]}</option>)}</select></label>
          <label className="sm:col-span-2"><span className="mb-2 block text-sm font-medium text-gray-200">{t.repeatLabel}</span><select value={form.recurrenceRule} onChange={(e) => setForm({ ...form, recurrenceRule: e.target.value })} className="w-full rounded-xl border border-white/10 bg-[#0B1422] px-4 py-3 text-white">{recurrenceValues.map((value) => <option key={value || "never"} value={value}>{t.repeats[value]}</option>)}</select></label>
          <label className="sm:col-span-2"><span className="mb-2 block text-sm font-medium text-gray-200">{t.descriptionLabel}</span><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-xl border border-white/10 bg-[#0B1422] px-4 py-3 text-white outline-none focus:border-blue-500" /></label>
          <div className="flex gap-3 sm:col-span-2"><button disabled={busy} type="submit" className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-50">{busy ? "…" : t.create}</button><button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-gray-300">{t.close}</button></div>
        </form>
      )}
      <div className="mt-6 space-y-3">
        {active.length === 0 && reminders.length === 0 ? <p className="rounded-2xl border border-dashed border-white/10 px-5 py-8 text-center text-gray-500">{t.empty}</p> : null}
        {reminders.map((reminder) => (
          <article key={reminder.id} className="rounded-2xl border border-white/10 bg-[#0B1422] p-4 sm:flex sm:items-center sm:justify-between sm:gap-5">
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-semibold text-white">{reminder.title}</h3><span className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-gray-400">{t.types[reminder.reminder_type] ?? reminder.reminder_type}</span>{reminder.recurrence_rule && <span className="rounded-full border border-blue-500/20 px-2 py-1 text-[11px] text-blue-300">{t.repeats[reminder.recurrence_rule] ?? t.recurring}</span>}</div><p className="mt-2 text-sm text-gray-300">{formatDate(reminder.due_at)}{reminder.remind_before_minutes ? ` · ${t.leads[String(reminder.remind_before_minutes)] ?? `${reminder.remind_before_minutes} min`}` : ""}</p>{reminder.description && <p className="mt-1 text-sm text-gray-500">{reminder.description}</p>}</div>
            {reminder.status === "pending" && reminder.enabled ? <div className="mt-4 flex shrink-0 gap-2 sm:mt-0"><button disabled={busy} onClick={() => action(reminder.id, "complete")} className="rounded-lg border border-emerald-500/20 px-3 py-2 text-xs font-semibold text-emerald-300">{t.complete}</button><button disabled={busy} onClick={() => action(reminder.id, "cancel")} className="rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold text-gray-400">{t.cancel}</button></div> : <span className="mt-3 inline-block text-xs text-gray-500 sm:mt-0">{reminder.status === "completed" ? t.done : reminder.status === "sent" ? t.sent : t.cancelled}</span>}
          </article>
        ))}
      </div>
    </section>
  );
}
