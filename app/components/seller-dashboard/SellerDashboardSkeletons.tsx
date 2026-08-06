export function SellerDashboardPageSkeleton() {
  return (
    <div className="space-y-8 lg:space-y-10" aria-hidden="true">
      <div className="space-y-3 rounded-[28px] border border-white/[0.04] bg-[#111827] p-6 sm:p-8">
        <div className="h-3 w-28 animate-pulse rounded bg-[#1a2332]" />
        <div className="h-10 w-2/3 max-w-md animate-pulse rounded-xl bg-[#1a2332]" />
        <div className="h-4 w-full max-w-lg animate-pulse rounded bg-[#1a2332]" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-32 animate-pulse rounded-2xl border border-white/[0.04] bg-[#111827]"
          />
        ))}
      </div>

      <div className="h-56 animate-pulse rounded-[28px] border border-white/[0.04] bg-[#111827]" />

      <div className="h-80 animate-pulse rounded-3xl border border-white/[0.04] bg-[#111827]" />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-10">
        <div className="space-y-8">
          <div className="h-96 animate-pulse rounded-3xl border border-white/[0.04] bg-[#111827]" />
          <div className="h-72 animate-pulse rounded-3xl border border-white/[0.04] bg-[#111827]" />
          <div className="h-64 animate-pulse rounded-3xl border border-white/[0.04] bg-[#111827]" />
        </div>
        <div className="h-[420px] animate-pulse rounded-3xl border border-white/[0.04] bg-[#111827]" />
      </div>
    </div>
  );
}

export function SellerDashboardOverviewSkeleton() {
  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-10">
      <div className="space-y-8">
        <div className="h-80 animate-pulse rounded-3xl border border-white/[0.04] bg-[#111827]" />
        <div className="h-[420px] animate-pulse rounded-3xl border border-white/[0.04] bg-[#111827]" />
        <div className="h-72 animate-pulse rounded-3xl border border-white/[0.04] bg-[#111827]" />
      </div>
      <div className="space-y-8">
        <div className="h-96 animate-pulse rounded-3xl border border-white/[0.04] bg-[#111827]" />
        <div className="h-64 animate-pulse rounded-3xl border border-white/[0.04] bg-[#111827]" />
      </div>
    </div>
  );
}
