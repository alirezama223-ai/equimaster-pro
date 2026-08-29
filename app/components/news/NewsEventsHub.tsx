import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

const NEWS_SOURCES = [
  { name: "FEI News", href: "https://inside.fei.org/fei/your-role/media/news" },
  { name: "World of Showjumping", href: "https://www.worldofshowjumping.com/" },
  { name: "Horse Sport", href: "https://horsesport.com/" },
] as const;

const EVENT_SOURCES = [
  { name: "FEI Calendar", href: "https://data.fei.org/Calendar/Search.aspx" },
  { name: "Longines Global Champions Tour", href: "https://www.globalchampionstour.com/calendar/" },
  { name: "CHIO Aachen", href: "https://www.chioaachen.de/en/" },
  { name: "World Cup", href: "https://inside.fei.org/fei/disciplines/jumping/world-cup" },
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
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">{t("comingSoonLabel")}</p>
            <h2 className="mt-2 text-2xl font-bold">{t("liveFeedTitle")}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{t("liveFeedDescription")}</p>
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
