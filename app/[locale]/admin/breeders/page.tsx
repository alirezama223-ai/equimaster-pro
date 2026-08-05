import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Navbar from "@/app/components/navbar/Navbar";
import AdminNav from "@/app/components/admin/AdminNav";
import AdminBreederTable from "@/app/components/admin/AdminBreederTable";
import AdminVerificationFilters from "@/app/components/admin/AdminVerificationControls";
import { getAdminBreeders } from "@/app/actions/admin";
import type { AdminVerificationFilter } from "@/app/lib/admin";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ filter?: string }>;
};

function parseFilter(value: string | undefined): AdminVerificationFilter {
  if (value === "verified" || value === "pending") {
    return value;
  }

  return "all";
}

export default async function AdminBreedersPage({ searchParams }: Props) {
  const t = await getTranslations("admin");
  const { filter: filterParam } = await searchParams;
  const filter = parseFilter(filterParam);
  const { breeders, error } = await getAdminBreeders(filter);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#08111F] pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-blue-400">{t("adminEyebrow")}</p>
              <h1 className="mt-2 text-3xl font-black text-white sm:text-4xl">{t("breeders.title")}</h1>
              <p className="mt-3 text-gray-400">{t("breeders.subtitle")}</p>
            </div>
            <Link
              href="/admin"
              className="inline-flex rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:border-blue-500 transition"
            >
              {t("nav.dashboard")}
            </Link>
          </div>

          <AdminNav />
          <AdminVerificationFilters basePath="/admin/breeders" currentFilter={filter} />

          {error ? (
            <div className="rounded-3xl border border-red-500/30 bg-red-500/10 px-6 py-8 text-red-200">
              {error}
            </div>
          ) : (
            <AdminBreederTable breeders={breeders} />
          )}
        </div>
      </main>
    </>
  );
}
