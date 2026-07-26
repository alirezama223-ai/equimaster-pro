import Link from "next/link";
import Navbar from "@/app/components/navbar/Navbar";
import AdminNav from "@/app/components/admin/AdminNav";
import AdminStatsGrid from "@/app/components/admin/AdminStatsGrid";
import { getAdminDashboardStats } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const { stats, error } = await getAdminDashboardStats();

  if (!stats) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#08111F] pt-28 pb-24">
          <div className="max-w-7xl mx-auto px-6">
            <div className="rounded-3xl border border-red-500/30 bg-red-500/10 px-6 py-8 text-red-200">
              {error ?? "Unable to load admin dashboard."}
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#08111F] pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-6 space-y-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-blue-400">EquiMaster Pro</p>
              <h1 className="mt-2 text-4xl font-black text-white">Admin Dashboard</h1>
              <p className="mt-3 text-gray-400 max-w-2xl">
                Manage verification for stud farms and stallions. More moderation tools can be
                added here later.
              </p>
            </div>
            <Link
              href="/account"
              className="inline-flex rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:border-blue-500 transition"
            >
              Back to Account
            </Link>
          </div>

          <AdminNav />
          <AdminStatsGrid stats={stats} />

          <div className="grid gap-5 md:grid-cols-2">
            <Link
              href="/admin/breeders?filter=pending"
              className="rounded-3xl border border-white/10 bg-[#111827] p-6 hover:border-blue-500/40 transition"
            >
              <h2 className="text-xl font-bold text-white">Review Breeders</h2>
              <p className="mt-2 text-gray-400">
                Verify or unverify stud farm profiles before they appear trusted in the directory.
              </p>
            </Link>
            <Link
              href="/admin/stallions?filter=pending"
              className="rounded-3xl border border-white/10 bg-[#111827] p-6 hover:border-blue-500/40 transition"
            >
              <h2 className="text-xl font-bold text-white">Review Stallions</h2>
              <p className="mt-2 text-gray-400">
                Manage stallion verification badges across the public stallion directory.
              </p>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
