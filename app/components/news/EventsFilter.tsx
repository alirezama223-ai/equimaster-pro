"use client";

import { useEffect, useMemo, useState } from "react";

type Event = {
  name: string;
  href: string;
  date: string | null;
  location: string | null;
  discipline: string | null;
};

const DISCIPLINES = ["All", "Jumping", "Dressage", "Eventing", "Endurance", "Driving", "Vaulting"];
const COUNTRIES = ["All", "Germany", "France", "Belgium", "Netherlands", "Great Britain", "Italy", "Spain", "United States", "Switzerland", "Austria", "Poland", "Sweden", "Denmark"];
const MONTHS = ["All", "2026-08", "2026-09", "2026-10", "2026-11", "2026-12"];
const MONTH_NAMES: Record<string, string> = { "08": "aug", "09": "sep", "10": "oct", "11": "nov", "12": "dec" };
const monthLabel = (value: string) => value === "All" ? "All months" : new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(`${value}-01T00:00:00`));

function ExternalIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5h5v5M19 5l-8 8"/><path strokeLinecap="round" strokeLinejoin="round" d="M19 14v3a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3"/></svg>;
}

export default function EventsFilter() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [discipline, setDiscipline] = useState("All");
  const [country, setCountry] = useState("All");
  const [month, setMonth] = useState("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/events")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((data) => setEvents(data.events ?? []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => events.filter((event) => {
    const text = `${event.name} ${event.location ?? ""} ${event.discipline ?? ""}`.toLowerCase();
    const matchesQuery = text.includes(query.trim().toLowerCase());
    const matchesDiscipline = discipline === "All" || event.discipline === discipline;
    const matchesCountry = country === "All" || event.location === country;
    const monthName = MONTH_NAMES[month.slice(5)];
    const matchesMonth = month === "All" || (event.date ?? "").toLowerCase().includes(monthName);
    return matchesQuery && matchesDiscipline && matchesCountry && matchesMonth;
  }), [events, country, discipline, month, query]);

  return <section className="mb-8 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/[0.10] to-transparent p-6 sm:p-8">
    <div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Events</p><h2 className="mt-2 text-2xl font-bold">Find your next competition</h2><p className="mt-2 text-sm leading-6 text-slate-400">Live event data from FEI, with search and filters.</p></div>
    <div className="grid gap-3 md:grid-cols-4">
      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search event or country…" className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500/50" />
      <select value={discipline} onChange={(e) => setDiscipline(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none">{DISCIPLINES.map((item) => <option key={item}>{item}</option>)}</select>
      <select value={country} onChange={(e) => setCountry(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none">{COUNTRIES.map((item) => <option key={item}>{item}</option>)}</select>
      <select value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none">{MONTHS.map((item) => <option key={item} value={item}>{monthLabel(item)}</option>)}</select>
    </div>
    <div className="mt-5 flex items-center justify-between text-xs text-slate-500"><span>{loading ? "Loading live FEI events…" : `${filtered.length} matching event${filtered.length === 1 ? "" : "s"}`}</span><a href="https://www.fei.org/events" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold text-blue-300 hover:text-blue-200">Official FEI Calendar <ExternalIcon /></a></div>
    <div className="mt-5 grid gap-4 lg:grid-cols-2">
      {filtered.map((event) => <a key={event.href} href={event.href} target="_blank" rel="noopener noreferrer" className="group rounded-2xl border border-white/10 bg-slate-950/50 p-5 transition hover:border-blue-500/50 hover:bg-slate-950/80"><div className="flex items-start justify-between gap-4"><div><h3 className="text-xl font-bold text-white">{event.name}</h3><div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">{event.location && <span>{event.location}</span>}{event.discipline && <span>• {event.discipline}</span>}</div></div><ExternalIcon /></div><p className="mt-5 text-sm font-semibold text-slate-200">{event.date ?? "Date available on FEI"}</p><p className="mt-2 text-xs text-slate-500">Official FEI event page</p></a>)}
    </div>
    {!loading && filtered.length === 0 && <div className="mt-5 rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">No events match these filters.</div>}
  </section>;
}
