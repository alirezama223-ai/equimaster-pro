"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

type Event = {
  name: string;
  href: string;
  date: string | null;
  location: string | null;
  discipline: string | null;
};

const DISCIPLINES = ["All", "Jumping", "Dressage", "Eventing", "Endurance", "Driving", "Vaulting"];
const COUNTRIES = ["All", "Germany", "France", "Belgium", "Netherlands", "Great Britain", "Italy", "Spain", "United States", "Switzerland", "Austria", "Poland", "Sweden", "Denmark", "Ireland", "Portugal", "Czech Republic", "Norway", "Finland", "Australia", "New Zealand", "Canada", "Mexico"];
const MONTHS = ["All", "2026-08", "2026-09", "2026-10", "2026-11", "2026-12"];
const MONTH_NAMES: Record<string, string> = { "01": "Jan", "02": "Feb", "03": "Mar", "04": "Apr", "05": "May", "06": "Jun", "07": "Jul", "08": "Aug", "09": "Sep", "10": "Oct", "11": "Nov", "12": "Dec" };
const FAVORITES_KEY = "shabdiz:event-favorites";

const monthLabel = (value: string) => value === "All" ? "All months" : new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(`${value}-01T00:00:00`));

function ExternalIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5h5v5M19 5l-8 8"/><path strokeLinecap="round" strokeLinejoin="round" d="M19 14v3a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3"/></svg>;
}

function StarIcon({ filled = false }: { filled?: boolean }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="m12 3 2.78 5.63 6.22.9-4.5 4.39 1.06 6.2L12 17.2l-5.56 2.92 1.06-6.2L3 9.53l6.22-.9L12 3Z"/></svg>;
}

function matchesMonth(date: string | null, month: string) {
  if (month === "All" || !date) return true;
  const monthName = MONTH_NAMES[month.slice(5)];
  return monthName ? new RegExp(`\\b${monthName}\\b`, "i").test(date) : false;
}

export default function EventsFilter() {
  const t = useTranslations("news");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [discipline, setDiscipline] = useState("All");
  const [country, setCountry] = useState("All");
  const [month, setMonth] = useState("All");
  const [query, setQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [savedOnly, setSavedOnly] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(FAVORITES_KEY) ?? "[]");
      if (Array.isArray(stored)) setFavorites(stored.filter((value): value is string => typeof value === "string"));
    } catch {
      setFavorites([]);
    }
  }, []);

  useEffect(() => {
    fetch("/api/events")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setEvents(data.events ?? []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const toggleFavorite = (href: string) => {
    setFavorites((current) => {
      const next = current.includes(href) ? current.filter((item) => item !== href) : [...current, href];
      window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  };

  const filtered = useMemo(() => events.filter((event) => {
    const text = `${event.name} ${event.location ?? ""} ${event.discipline ?? ""}`.toLowerCase();
    const matchesQuery = text.includes(query.trim().toLowerCase());
    const matchesDiscipline = discipline === "All" || event.discipline === discipline;
    const matchesCountry = country === "All" || event.location === country;
    const matchesEventMonth = matchesMonth(event.date, month);
    const matchesSaved = !savedOnly || favorites.includes(event.href);
    return matchesQuery && matchesDiscipline && matchesCountry && matchesEventMonth && matchesSaved;
  }), [events, country, discipline, month, query, savedOnly, favorites]);

  return <section className="mb-8 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/[0.10] to-transparent p-6 sm:p-8">
    <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">{t("eventsFinderEyebrow")}</p><h2 className="mt-2 text-2xl font-bold">{t("eventsFinderTitle")}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{t("eventsFinderDescription")}</p></div>
      <button type="button" onClick={() => setSavedOnly((value) => !value)} className={`inline-flex w-fit items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${savedOnly ? "border-blue-500/60 bg-blue-500/15 text-blue-200" : "border-white/10 bg-slate-950/60 text-slate-300 hover:border-blue-500/40"}`} aria-pressed={savedOnly}><StarIcon filled={savedOnly} />{t("savedEvents")} ({favorites.length})</button>
    </div>

    <div className="grid gap-3 md:grid-cols-4">
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t("eventSearchPlaceholder")} className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500/50" />
      <select value={discipline} onChange={(e) => setDiscipline(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none">{DISCIPLINES.map((item) => <option key={item}>{item}</option>)}</select>
      <select value={country} onChange={(e) => setCountry(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none">{COUNTRIES.map((item) => <option key={item}>{item}</option>)}</select>
      <select value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none">{MONTHS.map((item) => <option key={item} value={item}>{monthLabel(item)}</option>)}</select>
    </div>

    <div className="mt-5 flex items-center justify-between text-xs text-slate-500"><span>{loading ? t("loadingEvents") : t("matchingEvents", { count: filtered.length })}</span><a href="https://www.fei.org/events" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold text-blue-300 hover:text-blue-200">{t("officialFeiCalendar")} <ExternalIcon /></a></div>

    <div className="mt-5 grid gap-4 lg:grid-cols-2">
      {filtered.map((event) => {
        const isFavorite = favorites.includes(event.href);
        return <article key={event.href} className="rounded-2xl border border-white/10 bg-slate-950/50 p-5 transition hover:border-blue-500/40 hover:bg-slate-950/80">
          <div className="flex items-start justify-between gap-4"><button type="button" onClick={() => setSelectedEvent(event)} className="min-w-0 text-left"><h3 className="text-xl font-bold text-white hover:text-blue-200">{event.name}</h3><div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">{event.location && <span>{event.location}</span>}{event.discipline && <span>• {event.discipline}</span>}</div></button><button type="button" onClick={() => toggleFavorite(event.href)} aria-label={isFavorite ? t("removeFavorite") : t("saveFavorite")} aria-pressed={isFavorite} className={`shrink-0 rounded-lg p-2 transition ${isFavorite ? "text-blue-300 hover:bg-blue-500/10" : "text-slate-500 hover:bg-white/5 hover:text-slate-200"}`}><StarIcon filled={isFavorite} /></button></div>
          <p className="mt-5 text-sm font-semibold text-slate-200">{event.date ?? t("dateOnFei")}</p>
          <div className="mt-4 flex items-center justify-between gap-3"><button type="button" onClick={() => setSelectedEvent(event)} className="text-sm font-semibold text-blue-300 hover:text-blue-200">{t("viewEventDetails")} →</button><a href={event.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white">{t("openOfficialPage")} <ExternalIcon /></a></div>
        </article>;
      })}
    </div>

    {!loading && filtered.length === 0 && <div className="mt-5 rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">{t("noEventsMatch")}</div>}

    {selectedEvent && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="event-dialog-title" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedEvent(null); }}>
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl sm:p-8">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">{t("eventDetails")}</p><h2 id="event-dialog-title" className="mt-2 text-2xl font-bold text-white">{selectedEvent.name}</h2></div><button type="button" onClick={() => setSelectedEvent(null)} aria-label={t("closeDetails")} className="rounded-lg border border-white/10 px-3 py-2 text-slate-300 hover:bg-white/5">×</button></div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-white/10 bg-slate-950/60 p-4"><p className="text-xs uppercase tracking-wider text-slate-500">{t("dateLabel")}</p><p className="mt-2 font-semibold text-white">{selectedEvent.date ?? t("dateOnFei")}</p></div><div className="rounded-xl border border-white/10 bg-slate-950/60 p-4"><p className="text-xs uppercase tracking-wider text-slate-500">{t("locationLabel")}</p><p className="mt-2 font-semibold text-white">{selectedEvent.location ?? t("notAvailable")}</p></div><div className="rounded-xl border border-white/10 bg-slate-950/60 p-4"><p className="text-xs uppercase tracking-wider text-slate-500">{t("disciplineLabel")}</p><p className="mt-2 font-semibold text-white">{selectedEvent.discipline ?? t("notAvailable")}</p></div></div>
        <p className="mt-6 text-sm leading-6 text-slate-400">{t("eventDetailsDescription")}</p>
        <div className="mt-6 flex flex-wrap gap-3"><button type="button" onClick={() => toggleFavorite(selectedEvent.href)} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/60 px-4 py-2.5 text-sm font-semibold text-slate-200 hover:border-blue-500/40"> <StarIcon filled={favorites.includes(selectedEvent.href)} />{favorites.includes(selectedEvent.href) ? t("saved") : t("saveEvent")}</button><a href={selectedEvent.href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">{t("openOfficialEvent")} <ExternalIcon /></a></div>
      </div>
    </div>}
  </section>;
}
