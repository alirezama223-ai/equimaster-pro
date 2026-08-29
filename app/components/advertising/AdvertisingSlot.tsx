type AdvertisingSlotProps = {
  className?: string;
};

/**
 * Reserved premium advertising inventory for the homepage.
 * Keep the container stable so future ad providers can mount without shifting
 * the surrounding content (avoids layout shift when an ad loads).
 */
export default function AdvertisingSlot({ className = "" }: AdvertisingSlotProps) {
  return (
    <section
      aria-label="Advertisement"
      data-ad-slot="home-premium"
      className={`mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-10 ${className}`}
    >
      <div className="flex min-h-[120px] items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/[0.025]">
        <div className="h-[90px] w-full max-w-[970px]" aria-hidden="true" />
      </div>
    </section>
  );
}
