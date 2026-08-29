"use client";

import { useMemo, useState } from "react";

const EVENTS = [
  { name: "Brussels", location: "Belgium", dates: "25–30 Aug 2026", discipline: "Jumping", month: "2026-08", href: "https://www.fei.org/events/2026_CI_0184/", featured: true },
  { name: "Monpazier", location: "France", dates: "27–30 Aug 2026", discipline: "Endurance", month: "2026-08", href: "https://www.fei.org/events/2026_CI_0698/Monpazier", featured: false },
  { name: "Chepstow", location: "Great Britain", dates: "27–31 Aug 2026", discipline: "Jumping", month: "2026-08", href: "https://www.fei.org/events/2026_CI_0068", featured: false },
  { name: "Gijon", location: "Spain", dates: "29 Aug 2026", discipline: "Jumping", month: "2026-08", href: "https://www.fei.org/events/2026_CI_1089/Gijon", featured: false },
  { name: "Del Mar, CA (Horse Park)", location: "United States", dates: "26–29 Aug 2026", discipline: "Jumping · Dressage", month: "2026-08", href: "https://www.fei.org/events/2026_CI_0976/Del-Mar-CA-Horse-Park", featured: false },
  { name: "Münster", location: "Germany", dates: "3–6 Sep 2026", discipline: "Jumping · Dressage", month: "2026-09", href: "https://www.fei.org/events/2026_CI_0013/", featured: false },
  { name: "Ising am Chiemsee", location: "Germany", dates: "2–6 Sep 2026", discipline: "Jumping", month: "2026-09", href: "https://www.fei.org/events/2026_CI_0410", featured: false },
  { name: "Paderborn", location: "Germany", dates: "9–13 Sep 2026", discipline: "Jumping", month: "2026-09", href: "https://www.fei.org/events/2026_CI_0050/Paderborn", featured: false },
  { name: "Lignières", location: "France", dates: "23–27 Sep 2026", discipline: "Eventing", month: "2026-09", href: "https://www.fei.org/events/2026_CI_0070/Lignieres", featured: false },
  { name: "Mechtersen", location: "Germany", dates: "25–27 Sep 2026", discipline: "Eventing", month: "2026-09", href: "https://www.fei.org/events/2026_CI_0027", featured: false },
  { name: "Boekelo", location: "Netherlands", dates: "30 Sep–4 Oct 2026", discipline: "Eventing", month: "2026-09", href: "https://www.fei.org/events/2026_CI_0075", featured: false },
] as const;

const DISCIPLINES = ["All", "Jumping", "Dressage", "Eventing", "Endurance", "Driving", "Vaulting"];
const COUNTRIES = ["All", "Germany", "France", "Belgium", "Netherlands", "Great Britain", "Italy", "Spain", "United States"];
const MONTHS = ["All", "2026-08", "2026-09", "2026-10", "2026-11"];
const monthLabel = (value: string) => value === "All" ? "All months" : new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(new Date(`${value}-01T00:00:00`));

function ExternalIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5h5v5M19 5l-8 8" /><path strokeLinecap="round" strokeLinejoin="round" d="M19 14v3a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3" /></svg>;
}

export default function EventsFilter() {
  const [discipline, setDiscipline] = useState("All");
  const [country, setCountry] = useState("All");
  const [month, setMonth] = useState("All");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => EVENTS.filter((event) => {
    const matchesDiscipline = discipline === "All" || event.discipline.includes(discipline);
    const matchesCountry = country === "All" || event.location === country;
    const matchesMonth = month === "All" || event.month === month;
    const text = `${event.name} ${event.location} ${event.discipline}`.toLowerCase();
    return matchesDiscipline && matchesCountry && matchesMonth && text.includes(query.trim().toLowerCase());
  }), [discipline, country, month, query]);

  return (
    <section className="mb-8 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/[0.10] to-transparent p-6 sm:p-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">Events</p>
        <h2 className="mt-2 text-2xl font-bold">Find your next competition</h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">Filter events by discipline, country, month, or search by event and city.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search event or city…" className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-blue-500/50" />
        <select value={discipline} onChange={(e) => setDiscipline(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none">{DISCIPLINES.map((item) => <option key={item}>{item}</option>)}</select>
        <select value={country} onChange={(e) => setCountry(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none">{COUNTRIES.map((item) => <option key={item}>{item}</option>)}</select>
        <select value={month} onChange={(e) => setMonth(e.target.value)} className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none">{MONTHS.map((item) => <option key={item} value={item}>{monthLabel(item)}</option>)}</select>
      </div>
      <div className="mt-5 flex items-center justify-between text-xs text-slate-500"><span>{filtered.length} matching event{filtered.length === 1 ? "" : "s"}</span><a href="https://www.fei.org/events" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 font-semibold text-blue-300 hover:text-blue-200">Official FEI Calendar <ExternalIcon /></a></div>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {filtered.map((event) => <a key={event.href} href={event.href} target="_blank" rel="noopener noreferrer" className="group rounded-2xl border border-white/10 bg-slate-950/50 p-5 transition hover:border-blue-500/50 hover:bg-slate-950/80"><div className="flex items-start justify-between gap-4"><div>{event.featured && <span className="inline-flex rounded-full bg-blue-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-blue-300">Featured</span>}<h3 className="mt-2 text-xl font-bold text-white">{event.name}</h3><p className="mt-1 text-sm text-slate-400">{event.location} · {event.discipline}</p></div><ExternalIcon /></div><p className="mt-5 text-sm font-semibold text-slate-200">{event.dates}</p><p className="mt-2 text-xs text-slate-500">Official FEI event page</p></a>)}
      </div>
      {filtered.length === 0 && <div className="mt-5 rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-500">No events match these filters.</div>}
    </section>
  );
}
