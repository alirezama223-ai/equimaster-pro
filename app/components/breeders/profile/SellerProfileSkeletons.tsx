export function SellerProfilePageSkeleton() {
  return (
    <div className="space-y-8" aria-hidden="true">
      <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0f1729]">
        <div className="aspect-[21/9] animate-pulse bg-[#1a2332]" />
        <div className="px-6 pb-8">
          <div className="-mt-14 h-28 w-28 animate-pulse rounded-2xl bg-[#1a2332]" />
          <div className="mt-4 h-8 w-2/3 animate-pulse rounded-lg bg-[#1a2332]" />
          <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-[#1a2332]" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-2xl bg-[#1a2332]" />
        ))}
      </div>
    </div>
  );
}
