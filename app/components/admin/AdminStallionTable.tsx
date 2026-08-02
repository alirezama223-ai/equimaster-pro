"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { setStallionVerified, type AdminStallionListItem } from "@/app/actions/admin";
import VerifiedBadge from "@/app/components/admin/VerifiedBadge";
import { AdminVerificationActions } from "@/app/components/admin/AdminVerificationControls";

type Props = {
  stallions: AdminStallionListItem[];
};

export default function AdminStallionTable({ stallions }: Props) {
  const t = useTranslations("admin.stallions");

  if (stallions.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 px-6 py-12 text-center text-gray-500">
        {t("empty")}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-white/10">
      <table className="min-w-full divide-y divide-white/10 text-sm">
        <thead className="bg-[#0B1424] text-left text-gray-400 uppercase tracking-wide text-xs">
          <tr>
            <th className="px-4 py-4">{t("stallion")}</th>
            <th className="px-4 py-4">{t("studFarm")}</th>
            <th className="px-4 py-4">{t("owner")}</th>
            <th className="px-4 py-4">{t("breedCountry")}</th>
            <th className="px-4 py-4">{t("created")}</th>
            <th className="px-4 py-4">{t("status")}</th>
            <th className="px-4 py-4">{t("actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10 bg-[#111827]">
          {stallions.map((stallion) => (
            <tr key={stallion.id}>
              <td className="px-4 py-4">
                <div className="flex items-center gap-3 min-w-[220px]">
                  <div className="relative h-12 w-16 overflow-hidden rounded-xl bg-[#08111F]">
                    <Image src={stallion.coverImageUrl} alt="" fill className="object-cover" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{stallion.name}</p>
                    <Link
                      href={`/stallions/${stallion.id}`}
                      className="text-blue-400 hover:text-blue-300 text-xs"
                    >
                      {t("publicProfile")}
                    </Link>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 text-gray-300">{stallion.breederName}</td>
              <td className="px-4 py-4 text-gray-300 font-mono text-xs">{stallion.ownerReference}</td>
              <td className="px-4 py-4 text-gray-300">
                {stallion.breed}
                <span className="block text-xs text-gray-500">{stallion.country}</span>
              </td>
              <td className="px-4 py-4 text-gray-400">
                {new Date(stallion.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-4">
                {stallion.verified ? <VerifiedBadge /> : <span className="text-gray-400">{t("pending")}</span>}
              </td>
              <td className="px-4 py-4 min-w-[180px]">
                <AdminVerificationActions
                  entityLabel={stallion.name}
                  verified={stallion.verified}
                  onVerify={() => setStallionVerified(stallion.id, true)}
                  onUnverify={() => setStallionVerified(stallion.id, false)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
