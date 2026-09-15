"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "@/i18n/navigation";
import { cancelReminder, completeReminder, createReminder, updateReminder } from "@/app/actions/reminders";
import type { ReminderHorseOption, ReminderRow } from "@/app/actions/reminders";

type Props = { reminders: ReminderRow[]; horses: ReminderHorseOption[] };
type ReminderForm = { title: string; description: string; reminderType: string; horseId: string; dueAt: string; remindBeforeMinutes: number; recurrenceRule: string };

type Copy = {
  title:string; subtitle:string; add:string; edit:string; cancel:string; close:string; complete:string; save:string; create:string;
  titleLabel:string; typeLabel:string; horseLabel:string; noHorse:string; dateLabel:string; leadLabel:string; repeatLabel:string; notesLabel:string;
  placeholder:string; empty:string; completed:string; cancelled:string; sent:string; repeats:string; next:string; required:string; error:string;
  status:string; types:Record<string,string>; leads:Record<string,string>; repeatsMap:Record<string,string>;
};

const base = {
  types:{training:"Training",vaccination:"Vaccination",dental:"Dental",farrier:"Farrier",medication:"Medication",vet:"Vet",custom:"Custom"},
  leads:{"0":"At the time","5":"5 minutes","10":"10 minutes","30":"30 minutes","60":"1 hour","1440":"1 day","2880":"2 days"},
  repeatsMap:{"":"Does not repeat","FREQ=DAILY":"Every day","FREQ=WEEKLY":"Every week","FREQ=WEEKLY;INTERVAL=2":"Every 2 weeks","FREQ=WEEKLY;INTERVAL=4":"Every 4 weeks","FREQ=WEEKLY;INTERVAL=6":"Every 6 weeks","FREQ=MONTHLY":"Every month","FREQ=MONTHLY;INTERVAL=6":"Every 6 months","FREQ=YEARLY":"Every year"},
};
const copy:Record<string,Copy> = {
  en:{title:"Reminders",subtitle:"Keep training, health and care dates in one place.",add:"Add reminder",edit:"Edit",cancel:"Cancel",close:"Close",complete:"Mark complete",save:"Save changes",create:"Create reminder",titleLabel:"Title",typeLabel:"Type",horseLabel:"Horse",noHorse:"General reminder",dateLabel:"Date & time",leadLabel:"Remind me before",repeatLabel:"Repeat",notesLabel:"Notes",placeholder:"e.g. Annual vaccination",empty:"No reminders yet.",completed:"Completed",cancelled:"Cancelled",sent:"Sent",repeats:"Repeats",next:"Next",required:"Please enter a title and date.",error:"Something went wrong.",status:"Status",...base},
  de:{title:"Erinnerungen",subtitle:"Training, Gesundheit und Pflege an einem Ort verwalten.",add:"Erinnerung hinzufügen",edit:"Bearbeiten",cancel:"Abbrechen",close:"Schließen",complete:"Als erledigt markieren",save:"Änderungen speichern",create:"Erinnerung erstellen",titleLabel:"Titel",typeLabel:"Typ",horseLabel:"Pferd",noHorse:"Allgemeine Erinnerung",dateLabel:"Datum & Uhrzeit",leadLabel:"Vorher erinnern",repeatLabel:"Wiederholung",notesLabel:"Notizen",placeholder:"z. B. Jährliche Impfung",empty:"Noch keine Erinnerungen.",completed:"Erledigt",cancelled:"Abgebrochen",sent:"Gesendet",repeats:"Wiederholt sich",next:"Nächster Termin",required:"Bitte Titel und Datum eingeben.",error:"Etwas ist schiefgelaufen.",status:"Status",types:{training:"Training",vaccination:"Impfung",dental:"Zähne",farrier:"Hufschmied",medication:"Medikament",vet:"Tierarzt",custom:"Eigene"},leads:{"0":"Zum Zeitpunkt","5":"5 Minuten","10":"10 Minuten","30":"30 Minuten","60":"1 Stunde","1440":"1 Tag","2880":"2 Tage"},repeatsMap:{"":"Keine Wiederholung","FREQ=DAILY":"Täglich","FREQ=WEEKLY":"Wöchentlich","FREQ=WEEKLY;INTERVAL=2":"Alle 2 Wochen","FREQ=WEEKLY;INTERVAL=4":"Alle 4 Wochen","FREQ=WEEKLY;INTERVAL=6":"Alle 6 Wochen","FREQ=MONTHLY":"Monatlich","FREQ=MONTHLY;INTERVAL=6":"Alle 6 Monate","FREQ=YEARLY":"Jährlich"}},
  fr:{title:"Rappels",subtitle:"Gardez les dates d'entraînement, de santé et de soins au même endroit.",add:"Ajouter un rappel",edit:"Modifier",cancel:"Annuler",close:"Fermer",complete:"Marquer comme terminé",save:"Enregistrer",create:"Créer le rappel",titleLabel:"Titre",typeLabel:"Type",horseLabel:"Cheval",noHorse:"Rappel général",dateLabel:"Date et heure",leadLabel:"Me prévenir avant",repeatLabel:"Répétition",notesLabel:"Notes",placeholder:"ex. Vaccination annuelle",empty:"Aucun rappel pour le moment.",completed:"Terminé",cancelled:"Annulé",sent:"Envoyé",repeats:"Répétitif",next:"Prochain",required:"Veuillez saisir un titre et une date.",error:"Une erreur est survenue.",status:"Statut",types:{training:"Entraînement",vaccination:"Vaccination",dental:"Dentaire",farrier:"Maréchal-ferrant",medication:"Médicament",vet:"Vétérinaire",custom:"Personnalisé"},leads:{"0":"À l'heure","5":"5 minutes","10":"10 minutes","30":"30 minutes","60":"1 heure","1440":"1 jour","2880":"2 jours"},repeatsMap:{"":"Ne se répète pas","FREQ=DAILY":"Chaque jour","FREQ=WEEKLY":"Chaque semaine","FREQ=WEEKLY;INTERVAL=2":"Toutes les 2 semaines","FREQ=WEEKLY;INTERVAL=4":"Toutes les 4 semaines","FREQ=WEEKLY;INTERVAL=6":"Toutes les 6 semaines","FREQ=MONTHLY":"Chaque mois","FREQ=MONTHLY;INTERVAL=6":"Tous les 6 mois","FREQ=YEARLY":"Chaque année"}},
  nl:{title:"Herinneringen",subtitle:"Beheer trainings-, gezondheids- en verzorgingsdata op één plek.",add:"Herinnering toevoegen",edit:"Bewerken",cancel:"Annuleren",close:"Sluiten",complete:"Als voltooid markeren",save:"Wijzigingen opslaan",create:"Herinnering maken",titleLabel:"Titel",typeLabel:"Type",horseLabel:"Paard",noHorse:"Algemene herinnering",dateLabel:"Datum en tijd",leadLabel:"Herinner mij vooraf",repeatLabel:"Herhalen",notesLabel:"Notities",placeholder:"bijv. jaarlijkse vaccinatie",empty:"Nog geen herinneringen.",completed:"Voltooid",cancelled:"Geannuleerd",sent:"Verzonden",repeats:"Herhaling",next:"Volgende",required:"Vul een titel en datum in.",error:"Er ging iets mis.",status:"Status",types:{training:"Training",vaccination:"Vaccinatie",dental:"Gebit",farrier:"Hoefsmid",medication:"Medicatie",vet:"Dierenarts",custom:"Aangepast"},leads:base.leads,repeatsMap:{"":"Eenmalig","FREQ=DAILY":"Elke dag","FREQ=WEEKLY":"Elke week","FREQ=WEEKLY;INTERVAL=2":"Elke 2 weken","FREQ=WEEKLY;INTERVAL=4":"Elke 4 weken","FREQ=WEEKLY;INTERVAL=6":"Elke 6 weken","FREQ=MONTHLY":"Elke maand","FREQ=MONTHLY;INTERVAL=6":"Elke 6 maanden","FREQ=YEARLY":"Elk jaar"}},
  es:{title:"Recordatorios",subtitle:"Gestiona las fechas de entrenamiento, salud y cuidados en un solo lugar.",add:"Añadir recordatorio",edit:"Editar",cancel:"Cancelar",close:"Cerrar",complete:"Marcar como completado",save:"Guardar cambios",create:"Crear recordatorio",titleLabel:"Título",typeLabel:"Tipo",horseLabel:"Caballo",noHorse:"Recordatorio general",dateLabel:"Fecha y hora",leadLabel:"Avisarme antes",repeatLabel:"Repetir",notesLabel:"Notas",placeholder:"p. ej. vacunación anual",empty:"Aún no hay recordatorios.",completed:"Completado",cancelled:"Cancelado",sent:"Enviado",repeats:"Se repite",next:"Siguiente",required:"Introduce un título y una fecha.",error:"Algo salió mal.",status:"Estado",types:{training:"Entrenamiento",vaccination:"Vacunación",dental:"Dental",farrier:"Herrador",medication:"Medicación",vet:"Veterinario",custom:"Personalizado"},leads:base.leads,repeatsMap:{"":"No se repite","FREQ=DAILY":"Cada día","FREQ=WEEKLY":"Cada semana","FREQ=WEEKLY;INTERVAL=2":"Cada 2 semanas","FREQ=WEEKLY;INTERVAL=4":"Cada 4 semanas","FREQ=WEEKLY;INTERVAL=6":"Cada 6 semanas","FREQ=MONTHLY":"Cada mes","FREQ=MONTHLY;INTERVAL=6":"Cada 6 meses","FREQ=YEARLY":"Cada año"}},
};

const leadValues=[0,5,10,30,60,1440,2880];
const typeValues=["training","vaccination","dental","farrier","medication","vet","custom"];
const recurrenceValues=["","FREQ=DAILY","FREQ=WEEKLY","FREQ=WEEKLY;INTERVAL=2","FREQ=WEEKLY;INTERVAL=4","FREQ=WEEKLY;INTERVAL=6","FREQ=MONTHLY","FREQ=MONTHLY;INTERVAL=6","FREQ=YEARLY"];

function toInputDate(value:string){
  const d=new Date(value); const pad=(n:number)=>String(n).padStart(2,"0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function formatDate(value:string){return new Intl.DateTimeFormat(undefined,{dateStyle:"medium",timeStyle:"short"}).format(new Date(value));}
function emptyForm():ReminderForm{return{title:"",description:"",reminderType:"training",horseId:"",dueAt:"",remindBeforeMinutes:10,recurrenceRule:""};}
function formFromReminder(r:ReminderRow):ReminderForm{return{title:r.title,description:r.description??"",reminderType:r.reminder_type,horseId:r.horse_id??"",dueAt:toInputDate(r.due_at),remindBeforeMinutes:r.remind_before_minutes,recurrenceRule:r.recurrence_rule??""};}

export default function RemindersManager({reminders,horses}:Props){
  const router=useRouter();
  const locale=typeof document!=="undefined"?document.documentElement.lang.split("-")[0]:"en";
  const t=copy[locale]??copy.en;
  const [showForm,setShowForm]=useState(false); const [editing,setEditing]=useState<ReminderRow|null>(null);
  const [busy,setBusy]=useState(false); const [error,setError]=useState<string|null>(null); const [form,setForm]=useState<ReminderForm>(emptyForm());
  const active=useMemo(()=>reminders.filter(r=>r.status==="pending"&&r.enabled),[reminders]);

  function openCreate(){setError(null);setEditing(null);setForm(emptyForm());setShowForm(true);}
  function openEdit(r:ReminderRow){setError(null);setEditing(r);setForm(formFromReminder(r));setShowForm(true);window.scrollTo({top:0,behavior:"smooth"});}
  function closeForm(){if(!busy){setShowForm(false);setEditing(null);setError(null);}}
  async function submit(event:FormEvent){
    event.preventDefault();setError(null);
    if(!form.title.trim()||!form.dueAt){setError(t.required);return;}
    setBusy(true);
    const result=editing?await updateReminder(editing.id,form):await createReminder(form);
    setBusy(false);
    if(result.error){setError(result.error);return;}
    closeForm();router.refresh();
  }
  async function action(id:string,kind:"complete"|"cancel"){
    setBusy(true);setError(null);const result=kind==="complete"?await completeReminder(id):await cancelReminder(id);setBusy(false);
    if(result.error)setError(result.error);else router.refresh();
  }

  return <section className="rounded-3xl border border-white/10 bg-[#111827] p-6 sm:p-8">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[4px] text-blue-400">EquiMaster</p><h2 className="mt-2 text-2xl font-bold text-white">{t.title}</h2><p className="mt-2 text-sm text-gray-400">{t.subtitle}</p></div>
      {!showForm&&<button type="button" onClick={openCreate} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500">{t.add}</button>}
    </div>
    {error&&<div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>}
    {showForm&&<form onSubmit={submit} className="mt-6 grid gap-4 rounded-2xl border border-white/10 bg-black/10 p-5 sm:grid-cols-2">
      <div className="sm:col-span-2 flex items-center justify-between"><h3 className="text-lg font-semibold text-white">{editing?t.edit:t.create}</h3><button type="button" onClick={closeForm} className="text-sm text-gray-400 hover:text-white">{t.close}</button></div>
      <label className="sm:col-span-2"><span className="mb-2 block text-sm font-medium text-gray-200">{t.titleLabel}</span><input required maxLength={120} value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder={t.placeholder} className="w-full rounded-xl border border-white/10 bg-[#0B1422] px-4 py-3 text-white outline-none focus:border-blue-500" /></label>
      <label><span className="mb-2 block text-sm font-medium text-gray-200">{t.typeLabel}</span><select value={form.reminderType} onChange={e=>setForm({...form,reminderType:e.target.value})} className="w-full rounded-xl border border-white/10 bg-[#0B1422] px-4 py-3 text-white">{typeValues.map(v=><option key={v} value={v}>{t.types[v]}</option>)}</select></label>
      <label><span className="mb-2 block text-sm font-medium text-gray-200">{t.horseLabel}</span><select value={form.horseId} onChange={e=>setForm({...form,horseId:e.target.value})} className="w-full rounded-xl border border-white/10 bg-[#0B1422] px-4 py-3 text-white"><option value="">{t.noHorse}</option>{horses.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select></label>
      <label><span className="mb-2 block text-sm font-medium text-gray-200">{t.dateLabel}</span><input required type="datetime-local" value={form.dueAt} onChange={e=>setForm({...form,dueAt:e.target.value})} className="w-full rounded-xl border border-white/10 bg-[#0B1422] px-4 py-3 text-white" /></label>
      <label><span className="mb-2 block text-sm font-medium text-gray-200">{t.leadLabel}</span><select value={form.remindBeforeMinutes} onChange={e=>setForm({...form,remindBeforeMinutes:Number(e.target.value)})} className="w-full rounded-xl border border-white/10 bg-[#0B1422] px-4 py-3 text-white">{leadValues.map(v=><option key={v} value={v}>{t.leads[String(v)]}</option>)}</select></label>
      <label><span className="mb-2 block text-sm font-medium text-gray-200">{t.repeatLabel}</span><select value={form.recurrenceRule} onChange={e=>setForm({...form,recurrenceRule:e.target.value})} className="w-full rounded-xl border border-white/10 bg-[#0B1422] px-4 py-3 text-white">{recurrenceValues.map(v=><option key={v} value={v}>{t.repeatsMap[v]}</option>)}</select></label>
      <label><span className="mb-2 block text-sm font-medium text-gray-200">{t.notesLabel}</span><textarea rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="w-full rounded-xl border border-white/10 bg-[#0B1422] px-4 py-3 text-white" /></label>
      <div className="sm:col-span-2 flex justify-end gap-3"><button type="button" onClick={closeForm} disabled={busy} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-gray-300 hover:bg-white/5">{t.cancel}</button><button type="submit" disabled={busy} className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">{busy?"…":editing?t.save:t.create}</button></div>
    </form>}

    <div className="mt-6 space-y-3">
      {active.length===0&&!showForm&&<div className="rounded-2xl border border-dashed border-white/10 px-5 py-10 text-center text-sm text-gray-500">{t.empty}</div>}
      {active.map(r=><article key={r.id} className="rounded-2xl border border-white/10 bg-[#0B1422] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="truncate text-base font-semibold text-white">{r.title}</h3><span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-300">{t.types[r.reminder_type]??r.reminder_type}</span>{r.recurrence_rule&&<span className="rounded-full bg-purple-500/10 px-2.5 py-1 text-xs font-medium text-purple-300">{t.repeats}: {t.repeatsMap[r.recurrence_rule]??r.recurrence_rule}</span>}</div>
            <p className="mt-2 text-sm text-gray-300">{formatDate(r.due_at)}</p>{r.description&&<p className="mt-1 text-sm text-gray-500">{r.description}</p>}
            {r.recurrence_rule&&<p className="mt-2 text-xs font-medium text-gray-400">{t.next}: {formatDate(r.due_at)}</p>}
          </div>
          <div className="flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={()=>openEdit(r)} className="rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-gray-200 hover:bg-white/5 disabled:opacity-50">{t.edit}</button><button type="button" disabled={busy} onClick={()=>action(r.id,"complete")} className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50">{t.complete}</button><button type="button" disabled={busy} onClick={()=>action(r.id,"cancel")} className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300 hover:bg-red-500/20 disabled:opacity-50">{t.cancel}</button></div>
        </div>
      </article>)}
    </div>
  </section>;
}
