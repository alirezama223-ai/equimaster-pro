type Props = {
  rows?: number;
};

export default function AdminTableSkeleton({ rows = 6 }: Props) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10">
      <div className="animate-pulse bg-[#0B1424] px-4 py-4">
        <div className="h-3 w-40 rounded bg-white/10" />
      </div>
      <div className="divide-y divide-white/10 bg-[#111827]">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex animate-pulse items-center gap-4 px-4 py-4">
            <div className="h-10 w-10 rounded-xl bg-white/10" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-1/3 rounded bg-white/10" />
              <div className="h-3 w-1/4 rounded bg-white/5" />
            </div>
            <div className="h-8 w-20 rounded-xl bg-white/10" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminMetricSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-3xl border border-white/10 bg-[#111827] p-5"
        >
          <div className="h-3 w-24 rounded bg-white/10" />
          <div className="mt-4 h-8 w-16 rounded bg-white/10" />
        </div>
      ))}
    </div>
  );
}
