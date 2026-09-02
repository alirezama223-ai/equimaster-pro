"use client";

import { useEffect, useRef } from "react";
import type { HomepageAdvertisement } from "@/app/actions/advertisements";

type AdvertisingSlotProps = {
  advertisements?: HomepageAdvertisement[];
  placement?: HomepageAdvertisement["placement"];
  className?: string;
};

function trackAdvertisement(adId: string, event: "impression" | "click") {
  try {
    const body = JSON.stringify({ adId, event });
    void fetch("/api/ads/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Analytics must never interrupt the user experience.
  }
}

function TrackedAdvertisement({ ad }: { ad: HomepageAdvertisement }) {
  const impressionSent = useRef(false);
  const cardRef = useRef<HTMLAnchorElement | HTMLDivElement>(null);

  useEffect(() => {
    const element = cardRef.current;
    if (!element || impressionSent.current) return;

    if (typeof IntersectionObserver === "undefined") {
      impressionSent.current = true;
      trackAdvertisement(ad.id, "impression");
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting && entry.intersectionRatio >= 0.5 && !impressionSent.current) {
          impressionSent.current = true;
          trackAdvertisement(ad.id, "impression");
          observer.disconnect();
        }
      },
      { threshold: [0.5] }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [ad.id]);

  const content = (
    <div className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] shadow-lg transition hover:border-blue-400/40 hover:bg-white/[0.04]">
      <div className="relative aspect-[8/3] w-full overflow-hidden bg-[#111827]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ad.image_url} alt={ad.title} loading="lazy" className="absolute inset-0 block h-full w-full object-contain transition duration-300 group-hover:scale-[1.01]" />
        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/80">Sponsored</span>
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{ad.title}</p><p className="truncate text-xs text-gray-500">{ad.advertiser_name}</p></div>
        {ad.target_url && <span className="shrink-0 text-xs font-semibold text-blue-400">Learn more →</span>}
      </div>
    </div>
  );

  if (!ad.target_url) {
    return <div ref={cardRef}>{content}</div>;
  }

  return (
    <a
      ref={cardRef}
      href={ad.target_url}
      target="_blank"
      rel="noreferrer sponsored"
      aria-label={`${ad.title} — ${ad.advertiser_name}`}
      onClick={() => trackAdvertisement(ad.id, "click")}
    >
      {content}
    </a>
  );
}

export default function AdvertisingSlot({ advertisements = [], placement = "homepage_featured", className = "" }: AdvertisingSlotProps) {
  const ads = advertisements.filter((ad) => ad.placement === placement);
  if (ads.length === 0) return null;

  return (
    <section aria-label="Advertisement" data-ad-slot={placement} className={`mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-10 ${className}`}>
      <div className={`grid gap-4 ${ads.length > 1 ? "md:grid-cols-2" : "grid-cols-1"}`}>
        {ads.map((ad) => <TrackedAdvertisement key={ad.id} ad={ad} />)}
      </div>
    </section>
  );
}
