import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const NEWS_SOURCES = [
  { name: "FEI News", href: "https://inside.fei.org/fei/your-role/media/news" },
  { name: "World of Showjumping", href: "https://www.worldofshowjumping.com/" },
  { name: "Horse Sport", href: "https://horsesport.com/" },
] as const;

const EVENT_SOURCES = [
  { name: "FEI Calendar", href: "https://www.fei.org/events" },
  { name: "Longines Global Champions Tour", href: "https://www.globalchampionstour.com/calendar/" },
  { name: "CHIO Aachen", href: "https://www.chioaachen.de/en/" },
  { name: "World Cup", href: "https://inside.fei.org/fei/disciplines/jumping/world-cup" },
] as const;

const CURRENT_EVENTS = [
  {
    name: "Brussels",
    location: "Belgium",
    dates: "25–30 Aug 2026",
    discipline: "Jumping",
    href: "https://www.fei.org/events/2026_CI_0184/",
    featured: true,
  },
  {
    name: "Monpazier",
    location: "France",
    dates: "27–30 Aug 2026",
    discipline: "Endurance",
    href: "https://www.fei.org/events/2026_CI_0698/Monpazier",
    featured: false,
  },
  {
    name: "Chepstow",
    location: "Great Britain",
    dates: "27–31 Aug 2026",
    discipline: "Jumping",
    href: "https://www.fei.org/events/2026_CI_0068",
    featured: false,
  },
  {
    name: "Gijon",
    location: "Spain",
    dates: "29 Aug 2026",
    discipline: "Jumping",
    href: "https://www.fei.org/events/2026_CI_1089/Gijon",
    featured: false,
  },
  {
    name: "Del Mar, CA (Horse Park)",
    location: "United States",
    dates: "26–29 Aug 2026",
    discipline: "Jumping · Dressage",
    href: "https://www.fei.org/events/2026_CI_0976/Del-Mar-CA-Horse-Park",
    featured: false,
  },
] as const;

function ExternalIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 5h5v5M19 5l-8 8" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 14v3a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3" />
    </svg>
  );
}

export default function NewsEventsHub() {
  const t = useTranslations("news");

  return (
    <main className="min-h-screen bg-slate-950 px-4 pb-16 pt-28 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-blue-400">{t("eyebrow")}</p>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t("title")}</h1>
            <p className="mt-4 text-base leading-7 text-slate-400 sm:text-lg">{t("description")}</p>
          </div>
          <Link href="/" className="inline-flex w-fit items-center rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-blue-500/50 hover:text-white">
            {t("backHome")}
          </Link>
        </div>

        <section className="mb-8 rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/[0.10] to-transparent p-6 sm:p-8">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">{t("eventsEyebrow")}</p>
              <h2 className="mt-2 text-2xl font-bold">Upcoming & Current Events</h2>
              <p className="mt-2 text-sm leading-6 text-slate-400">Verified current events from the FEI calendar. Dates and event details can change, so the official FEI page is the source of truth.</p>
            </div>
            <a href="https://www.fei.org/events" target="_blank" rel="noopener noreferrer" className="inline-flex w-fit items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2.5 text-sm font-semibold text-blue-200 transition hover:bg-blue-500/20">
              FEI Calendar <ExternalIcon />
            </a>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {CURRENT_EVENTS.map((event) => (
              <a key={event.href} href={event.href} target="_blank" rel="noopener noreferrer" className={`group rounded-2xl border p-5 transition hover:border-blue-500/50 hover:bg-slate-950/70 ${event.featured ? "border-blue-500/30 bg-slate-950/60 lg:col-span-2" : "border-white/10 bg-slate-950/40"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    {event.featured && <span className="inline-flex rounded-full bg-blue-500/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-blue-300">Featured</span>}
                    <h3 className="mt-2 text-xl font-bold text-white">{event.name}</h3>
                    <p className="mt-1 text-sm text-slate-400">{event.location} · {event.discipline}</p>
                  </div>
                  <ExternalIcon />
                </div>
                <p className="mt-5 text-sm font-semibold text-slate-200">{event.dates}</p>
                <p className="mt-2 text-xs text-slate-500">Official FEI event page · start lists · live results · results</p>
              </a>
            ))}
          </div>
        </section>

        <div className="grid gap-8 lg:grid-cols-2">
          <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 sm:p-8">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">{t("newsEyebrow")}</p>
              <h2 className="mt-2 text-2xl font-bold">{t("newsTitle")}</h2>
              <p className="mt-2 text-sm text-slate-400">{t("newsDescription")}</p>
            </div>
            <div className="space-y-3">
              {NEWS_SOURCES.map((source) => (
                <a key={source.href} href={source.href} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/60 p-4 transition hover:border-blue-500/40 hover:bg-slate-950">
                  <div>
                    <h3 className="font-semibold text-slate-100 group-hover:text-white">{source.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">{t("openSource")}</p>
                  </div>
                  <ExternalIcon />
                </a>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-6 sm:p-8">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">{t("eventsEyebrow")}</p>
              <h2 className="mt-2 text-2xl font-bold">{t("eventsTitle")}</h2>
              <p className="mt-2 text-sm text-slate-400">{t("eventsDescription")}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {EVENT_SOURCES.map((source) => (
                <a key={source.href} href={source.href} target="_blank" rel="noopener noreferrer" className="group flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/60 p-4 transition hover:border-blue-500/40 hover:bg-slate-950">
                  <div>
                    <h3 className="font-semibold text-slate-100 group-hover:text-white">{source.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">{t("eventCalendar")}</p>
                  </div>
                  <ExternalIcon />
                </a>
              ))}
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-2xl border border-white/10 bg-slate-900/50 p-6 sm:p-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div><p className="text-sm font-semibold text-white">{t("verifiedLinksTitle")}</p><p className="mt-2 text-sm leading-6 text-slate-400">{t("verifiedLinksDescription")}</p></div>
            <div><p className="text-sm font-semibold text-white">{t("personalizationTitle")}</p><p className="mt-2 text-sm leading-6 text-slate-400">{t("personalizationDescription")}</p></div>
            <div><p className="text-sm font-semibold text-white">{t("alertsTitle")}</p><p className="mt-2 text-sm leading-6 text-slate-400">{t("alertsDescription")}</p></div>
          </div>
        </section>
      </div>
    </main>
  );
}
