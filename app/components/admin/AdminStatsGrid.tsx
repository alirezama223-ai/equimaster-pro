import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
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

export default async function AdminStatsGrid({ stats }: Props) {
  const t = await getTranslations("admin.stats");

  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label={t("activeListings")} value={stats.activeListings} />
      <StatCard label={t("totalBreeders")} value={stats.totalBreeders} href="/admin/breeders" />
      <StatCard label={t("totalStallions")} value={stats.totalStallions} href="/admin/stallions" />
      <StatCard label={t("verifiedBreeders")} value={stats.verifiedBreeders} href="/admin/breeders?filter=verified" />
      <StatCard label={t("verifiedStallions")} value={stats.verifiedStallions} href="/admin/stallions?filter=verified" />
      <StatCard label={t("pendingBreeders")} value={stats.pendingBreeders} href="/admin/breeders?filter=pending" />
      <StatCard label={t("pendingStallions")} value={stats.pendingStallions} href="/admin/stallions?filter=pending" />
      <StatCard label={t("pedigreeRecords")} value={stats.totalPedigreeHorses} href="/admin/pedigree" />
      <StatCard label={t("verifiedPedigree")} value={stats.verifiedPedigreeHorses} href="/admin/pedigree?filter=verified" />
      <StatCard label={t("pendingPedigree")} value={stats.pendingPedigreeHorses} href="/admin/pedigree?filter=pending" />
    </div>
  );
}
