import type { HomepageAdvertisement } from "@/app/actions/advertisements";

type AdvertisingSlotProps = {
  advertisements?: HomepageAdvertisement[];
  placement?: HomepageAdvertisement["placement"];
  className?: string;
};

export default function AdvertisingSlot({ advertisements = [], placement = "homepage_featured", className = "" }: AdvertisingSlotProps) {
  const ads = advertisements.filter((ad) => ad.placement === placement);
  if (ads.length === 0) return null;

  return (
    <section aria-label="Advertisement" data-ad-slot={placement} className={`mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-10 ${className}`}>
      <div className={`grid gap-4 ${ads.length > 1 ? "md:grid-cols-2" : "grid-cols-1"}`}>
        {ads.map((ad) => {
          const content = (
            <div className="group overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025] shadow-lg transition hover:border-blue-400/40 hover:bg-white/[0.04]">
              <div className="relative aspect-[970/250] min-h-[120px] w-full overflow-hidden bg-[#111827]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ad.image_url} alt={ad.title} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.01]" />
                <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/80">Sponsored</span>
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{ad.title}</p><p className="truncate text-xs text-gray-500">{ad.advertiser_name}</p></div>
                {ad.target_url && <span className="shrink-0 text-xs font-semibold text-blue-400">Learn more →</span>}
              </div>
            </div>
          );
          return ad.target_url ? <a key={ad.id} href={ad.target_url} target="_blank" rel="noreferrer" aria-label={`${ad.title} — ${ad.advertiser_name}`}>{content}</a> : <div key={ad.id}>{content}</div>;
        })}
      </div>
    </section>
  );
}