"use client";

import type { HeroStats } from "@/app/actions/home-stats";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";

type Props = { stats: HeroStats };

function formatStatCount(value: number, locale: string) {
  return value.toLocaleString(locale);
}

export default function HeroSection({ stats }: Props) {
  const t = useTranslations("home");
  const locale = useLocale();

  return (
    <section id="home-hero" data-home-hero="" className="relative min-h-dvh overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white max-md:overflow-x-hidden">
      <div className="absolute -left-40 top-40 h-64 w-64 rounded-full bg-[#D4A437]/10 blur-[140px] md:h-96 md:w-96" />
      <div className="absolute right-0 bottom-0 h-72 w-72 rounded-full bg-[#D4A437]/[0.06] blur-[180px] md:h-[500px] md:w-[500px]" />

      <div className="relative mx-auto flex min-h-dvh w-full min-w-0 max-w-7xl items-center px-4 pb-16 pt-16 sm:px-6 sm:pb-20 md:pt-28 lg:px-8 lg:pt-32">
        <div className="grid w-full min-w-0 items-center gap-8 sm:gap-12 lg:grid-cols-2 lg:gap-24">
          <div className="min-w-0">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.16em] text-[#F7E1A1] sm:mb-6 sm:text-sm sm:tracking-[6px]">{t("hero.eyebrow")}</p>
            <h1 className="text-[42px] font-black leading-[1.0] md:text-6xl md:leading-tight lg:text-7xl lg:leading-[0.98]">
              {t("hero.title.line1")}<br />{t("hero.title.line2")}<br />{t("hero.title.line3")}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-[1.6] text-gray-300 md:mt-8 md:text-xl md:leading-9">{t("hero.subtitle")}</p>

            <div className="mt-8 flex w-full flex-col gap-4 md:mt-12 md:flex-row md:flex-wrap md:gap-5">
              <button type="button" className="min-h-11 w-full rounded-xl bg-[#D4A437] px-5 py-3 text-base font-bold text-[#081223] shadow-[0_10px_30px_rgba(212,164,55,0.18)] transition hover:bg-[#F7E1A1] md:w-auto md:px-8 md:py-4 md:text-lg">{t("hero.browseButton")}</button>
              <button type="button" className="min-h-11 w-full rounded-xl border border-[#D4A437]/40 px-5 py-3 text-base font-semibold text-white transition hover:border-[#D4A437] hover:bg-[#D4A437]/10 md:w-auto md:px-8 md:py-4 md:text-lg">{t("hero.sellButton")}</button>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-3 md:mt-16 md:flex md:flex-wrap md:gap-12">
              <div className="flex min-h-[108px] flex-col justify-center rounded-2xl border border-white/10 bg-white/[0.04] p-[18px] md:min-h-0 md:rounded-none md:border-0 md:bg-transparent md:p-0"><h3 className="text-2xl font-bold md:text-4xl">{formatStatCount(stats.activeListings, locale)}</h3><p className="text-sm text-gray-400 md:text-base">{t("hero.stats.sportHorses.label")}</p></div>
              <div className="flex min-h-[108px] flex-col justify-center rounded-2xl border border-white/10 bg-white/[0.04] p-[18px] md:min-h-0 md:rounded-none md:border-0 md:bg-transparent md:p-0"><h3 className="text-2xl font-bold md:text-4xl">{formatStatCount(stats.activeStallions, locale)}</h3><p className="text-sm text-gray-400 md:text-base">{t("hero.stats.breeders.label")}</p></div>
              <div className="col-span-2 flex min-h-[108px] flex-col justify-center rounded-2xl border border-white/10 bg-white/[0.04] p-[18px] md:col-span-1 md:min-h-0 md:rounded-none md:border-0 md:bg-transparent md:p-0"><h3 className="text-2xl font-bold md:text-4xl">{formatStatCount(stats.registeredBreeders, locale)}</h3><p className="text-sm text-gray-400 md:text-base">{t("hero.stats.countries.label")}</p></div>
            </div>
          </div>

          <div className="flex min-w-0 justify-center"><div className="relative w-full max-w-sm sm:max-w-md lg:max-w-none"><div className="absolute inset-0 scale-110 rounded-[35px] bg-[#D4A437]/10 blur-3xl" /><Image src="/shabdiz-hero.png" alt={t("hero.imageAlt")} width={700} height={900} priority fetchPriority="high" sizes="(max-width: 1024px) 90vw, 700px" className="relative h-auto w-full rounded-[35px] object-cover shadow-2xl" /></div></div>
        </div>
      </div>
    </section>
  );
}
