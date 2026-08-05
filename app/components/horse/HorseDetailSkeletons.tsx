export function HorseGallerySkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0f1729]">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#1a2332] via-[#243044] to-[#1a2332]" />
      </div>
      <div className="flex gap-2.5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="h-[72px] w-[96px] shrink-0 animate-pulse rounded-xl bg-[#1a2332] sm:h-20 sm:w-28"
          />
        ))}
      </div>
    </div>
  );
}

export function HorseSellerCardSkeleton() {
  return (
    <div
      className="rounded-2xl border border-white/[0.06] bg-[#0f1729]/90 p-5 sm:p-6"
      aria-hidden="true"
    >
      <div className="h-3 w-24 animate-pulse rounded bg-[#1a2332]" />
      <div className="mt-4 flex gap-4">
        <div className="h-14 w-14 shrink-0 animate-pulse rounded-2xl bg-[#1a2332]" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-3/4 animate-pulse rounded bg-[#1a2332]" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-[#1a2332]" />
          <div className="h-6 w-28 animate-pulse rounded-full bg-[#1a2332]" />
        </div>
      </div>
    </div>
  );
}

export function HorseSidebarSkeleton() {
  return (
    <div
      className="rounded-2xl border border-white/[0.06] bg-[#111827] p-5 sm:p-6"
      aria-hidden="true"
    >
      <div className="h-3 w-20 animate-pulse rounded bg-[#1a2332]" />
      <div className="mt-4 h-8 w-2/3 animate-pulse rounded bg-[#1a2332]" />
      <div className="mt-2 h-10 w-full animate-pulse rounded-xl bg-[#1a2332]" />
      <div className="mt-4 grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-12 animate-pulse rounded-xl bg-[#1a2332]" />
        ))}
      </div>
      <div className="mt-4 h-12 w-full animate-pulse rounded-xl bg-blue-900/40" />
    </div>
  );
}

export function RelatedHorsesSkeleton() {
  return (
    <section className="mt-16 lg:mt-20" aria-hidden="true">
      <div className="mb-6 flex justify-between">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-[#1a2332]" />
        <div className="h-5 w-24 animate-pulse rounded bg-[#1a2332]" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0f1729]">
            <div className="aspect-[16/10] animate-pulse bg-[#1a2332]" />
            <div className="space-y-3 p-4">
              <div className="h-5 w-3/4 animate-pulse rounded bg-[#1a2332]" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-[#1a2332]" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
