import Link from "next/link";
import { AdminDashboardStats } from "@/app/actions/admin";

type Props = {
  stats: AdminDashboardStats;
};

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href?: string;
}) {
  const content = (
    <div className="rounded-3xl border border-white/10 bg-[#111827] p-6 hover:border-blue-500/40 transition">
      <p className="text-sm uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-3 text-4xl font-black text-white">{value}</p>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}

export default function AdminStatsGrid({ stats }: Props) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Active Horse Listings" value={stats.activeListings} />
      <StatCard label="Total Breeders" value={stats.totalBreeders} href="/admin/breeders" />
      <StatCard label="Total Stallions" value={stats.totalStallions} href="/admin/stallions" />
      <StatCard label="Verified Breeders" value={stats.verifiedBreeders} href="/admin/breeders?filter=verified" />
      <StatCard label="Verified Stallions" value={stats.verifiedStallions} href="/admin/stallions?filter=verified" />
      <StatCard label="Pending Breeders" value={stats.pendingBreeders} href="/admin/breeders?filter=pending" />
      <StatCard label="Pending Stallions" value={stats.pendingStallions} href="/admin/stallions?filter=pending" />
      <StatCard label="Pedigree Records" value={stats.totalPedigreeHorses} href="/admin/pedigree" />
      <StatCard label="Verified Pedigree" value={stats.verifiedPedigreeHorses} href="/admin/pedigree?filter=verified" />
      <StatCard label="Pending Pedigree" value={stats.pendingPedigreeHorses} href="/admin/pedigree?filter=pending" />
    </div>
  );
}
