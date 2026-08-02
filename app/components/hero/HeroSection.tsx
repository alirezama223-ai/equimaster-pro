"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";

export default function HeroSection() {
  const t = useTranslations("home");

  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      <div className="absolute -left-40 top-40 h-96 w-96 rounded-full bg-blue-600/20 blur-[140px]" />
      <div className="absolute right-0 bottom-0 h-[500px] w-[500px] rounded-full bg-indigo-700/10 blur-[180px]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 pb-20 pt-24 sm:px-6 sm:pt-28 lg:px-8 lg:pt-32">
        <div className="grid w-full min-w-0 items-center gap-12 lg:grid-cols-2 lg:gap-24">
          <div className="min-w-0">
            <p className="mb-6 font-semibold uppercase tracking-[0.2em] text-blue-400 sm:tracking-[6px]">
              {t("hero.eyebrow")}
            </p>

            <h1 className="text-4xl font-black leading-tight sm:text-5xl md:text-6xl lg:text-8xl lg:leading-[0.95]">
              {t("hero.title.line1")}
              <br />
              {t("hero.title.line2")}
              <br />
              {t("hero.title.line3")}
            </h1>

            <p className="mt-8 max-w-xl text-lg leading-8 text-gray-300 sm:text-xl sm:leading-9">
              {t("hero.subtitle")}
            </p>

            <div className="mt-12 flex flex-wrap gap-4 sm:gap-5">
              <button
                type="button"
                className="rounded-xl bg-blue-600 px-6 py-3 text-base font-semibold shadow-xl transition hover:bg-blue-700 sm:px-8 sm:py-4 sm:text-lg"
              >
                {t("hero.browseButton")}
              </button>

              <button
                type="button"
                className="rounded-xl border border-white/20 px-6 py-3 text-base transition hover:bg-white hover:text-black sm:px-8 sm:py-4 sm:text-lg"
              >
                {t("hero.sellButton")}
              </button>
            </div>

            <div className="mt-16 flex flex-wrap gap-8 sm:gap-12">
              <div>
                <h3 className="text-3xl font-bold sm:text-4xl">
                  {t("hero.stats.sportHorses.value")}
                </h3>
                <p className="text-gray-400">{t("hero.stats.sportHorses.label")}</p>
              </div>

              <div>
                <h3 className="text-3xl font-bold sm:text-4xl">
                  {t("hero.stats.breeders.value")}
                </h3>
                <p className="text-gray-400">{t("hero.stats.breeders.label")}</p>
              </div>

              <div>
                <h3 className="text-3xl font-bold sm:text-4xl">
                  {t("hero.stats.countries.value")}
                </h3>
                <p className="text-gray-400">{t("hero.stats.countries.label")}</p>
              </div>
            </div>
          </div>

          <div className="flex min-w-0 justify-center">
            <div className="relative w-full max-w-md lg:max-w-none">
              <div className="absolute inset-0 scale-110 rounded-[35px] bg-blue-600/20 blur-3xl"></div>

              <Image
                src="/emi.jpg"
                alt={t("hero.imageAlt")}
                width={700}
                height={900}
                priority
                className="relative h-auto w-full max-w-full rounded-[35px] object-cover shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
