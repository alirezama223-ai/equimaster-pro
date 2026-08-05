export default function MarketplaceListingCardSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0f1729] shadow-[0_8px_32px_rgba(0,0,0,0.25)]"
      aria-hidden="true"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#1a2332]">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#1a2332] via-[#243044] to-[#1a2332]" />
        <div className="absolute inset-x-0 bottom-0 flex justify-end p-3 sm:p-4">
          <div className="h-14 w-28 animate-pulse rounded-xl bg-[#243044]/80" />
        </div>
      </div>
      <div className="space-y-4 p-4 sm:p-5">
        <div className="space-y-2">
          <div className="h-7 w-3/4 animate-pulse rounded-lg bg-[#1a2332]" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-[#1a2332]" />
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="h-6 w-14 animate-pulse rounded-lg bg-[#1a2332]" />
          <div className="h-6 w-16 animate-pulse rounded-lg bg-[#1a2332]" />
          <div className="h-6 w-12 animate-pulse rounded-lg bg-[#1a2332]" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className={`space-y-2 ${index === 2 ? "col-span-2" : ""}`}
            >
              <div className="h-3 w-12 animate-pulse rounded bg-[#1a2332]" />
              <div className="h-4 w-24 animate-pulse rounded bg-[#1a2332]" />
            </div>
          ))}
        </div>
        <div className="h-14 animate-pulse rounded-xl bg-[#1a2332]" />
        <div className="grid grid-cols-3 gap-2">
          <div className="h-11 animate-pulse rounded-xl bg-[#1a2332]" />
          <div className="h-11 animate-pulse rounded-xl bg-[#1a2332]" />
          <div className="h-11 animate-pulse rounded-xl bg-[#1a2332]" />
        </div>
        <div className="h-11 animate-pulse rounded-xl bg-[#1a2332]/80" />
      </div>
    </div>
  );
}

export function MarketplaceListingCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-7 lg:grid-cols-2 lg:gap-8 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <MarketplaceListingCardSkeleton key={index} />
      ))}
    </div>
  );
}
