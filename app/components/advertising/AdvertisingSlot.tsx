import Link from "next/link";
import type { HomepageAdvertisement } from "@/app/actions/advertisements";

type AdvertisingSlotProps = {
  advertisements?: HomepageAdvertisement[];
  className?: string;
};

/**
 * Premium homepage advertising inventory.
 * The slot stays stable even when no campaign is active to avoid layout shift.
 */
export default function AdvertisingSlot({ advertisements = [], className = "" }: AdvertisingSlotProps) {
  const ad = advertisements[0];

  return (
    <section
      aria-label="Advertisement"
      data-ad-slot="home-premium"
      className={`mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-10 ${className}`}
    >
      <div className="flex min-h-[120px] items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
        {ad ? (
          ad.target_url ? (
            <Link
              href={ad.target_url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="group flex h-[90px] w-full max-w-[970px] items-center overflow-hidden rounded-2xl px-5 transition hover:bg-white/[0.04]"
            >
              <AdvertisementContent ad={ad} />
            </Link>
          ) : (
            <div className="flex h-[90px] w-full max-w-[970px] items-center overflow-hidden rounded-2xl px-5">
              <AdvertisementContent ad={ad} />
            </div>
          )
        ) : (
          <div className="h-[90px] w-full max-w-[970px]" aria-hidden="true" />
        )}
      </div>
    </section>
  );
}

function AdvertisementContent({ ad }: { ad: HomepageAdvertisement }) {
  return (
    <>
      {ad.image_url ? (
        <img
          src={ad.image_url}
          alt={ad.alt_text || ad.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex w-full items-center justify-between gap-5">
          <div className="min-w-0">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400">Advertisement</div>
            <div className="truncate text-lg font-bold text-white sm:text-xl">{ad.title}</div>
            <div className="truncate text-sm text-gray-400">{ad.advertiser_name}</div>
          </div>
          {ad.target_url && (
            <span className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white group-hover:bg-blue-500">
              Learn more
            </span>
          )}
        </div>
      )}
    </>
  );
}
