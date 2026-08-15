"use client";

import type { HeroStats } from "@/app/actions/home-stats";
import { useLocale, useTranslations } from "next-intl";


type Props = { stats: HeroStats };

function formatStatCount(value: number, locale: string) {
  return value.toLocaleString(locale);
}

export default function HeroSection({ stats }: Props) {
  const t = useTranslations("home");
  const locale = useLocale();

  return (
    <section id="home-hero" data-home-hero="" className="relative min-h-dvh overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white max-md:overflow-x-hidden">
     <div className="flex min-w-0 justify-center">
  <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-none">
    <div className="absolute inset-0 scale-110 rounded-[35px] bg-[#D4A437]/10 blur-3xl" />

    <video
      className="relative h-auto w-full rounded-[35px] object-cover shadow-2xl"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      poster="/shabdiz-hero.png"
      aria-label={t("hero.imageAlt")}
    >
      <source src="/shabdiz-hero.mp4" type="video/mp4" />
    </video>
  </div>
</div>
