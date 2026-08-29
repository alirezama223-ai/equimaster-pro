import { useTranslations } from "next-intl";
import { fetchLiveNews } from "@/app/lib/news/live-feed";

export default async function LiveNewsFeed() {
  const items = await fetchLiveNews();
  const t = useTranslations("news");

  return (
    <section className="mb-8 rounded-2xl border border-white/10 bg-slate-900/70 p-6 sm:p-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-400">{t("liveFeedBadge")}</p>
          <h2 className="mt-2 text-2xl font-bold">{t("liveFeedHeading")}</h2>
          <p className="mt-2 text-sm text-slate-400">{t("liveFeedIntro")}</p>
        </div>
        <span className="hidden rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400 sm:inline-flex">{t("liveFeedRefresh")}</span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-slate-950/50 p-5 text-sm text-slate-400">
          {t("liveFeedUnavailable")}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((item) => (
            <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className="group rounded-xl border border-white/10 bg-slate-950/50 p-5 transition hover:border-blue-500/40 hover:bg-slate-950">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-400">{item.category}</span>
                <span className="text-xs text-slate-500">{item.source}</span>
              </div>
              <h3 className="mt-3 line-clamp-3 font-semibold leading-6 text-slate-100 group-hover:text-white">{item.title}</h3>
              <p className="mt-4 text-xs font-semibold text-slate-500">{t("liveFeedOpenArticle")}</p>
            </a>
          ))}
        </div>
      )}
    </section>
  );
}
