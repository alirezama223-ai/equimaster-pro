import { AdminMetricSkeletonGrid } from "@/app/components/admin/AdminTableSkeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-8">
      <div className="animate-pulse space-y-3">
        <div className="h-3 w-24 rounded bg-white/10" />
        <div className="h-8 w-64 max-w-full rounded bg-white/10" />
        <div className="h-4 w-96 max-w-full rounded bg-white/5" />
      </div>
      <AdminMetricSkeletonGrid count={8} />
    </div>
  );
}
