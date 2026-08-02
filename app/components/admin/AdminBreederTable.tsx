"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { setBreederVerified, type AdminBreederListItem } from "@/app/actions/admin";
import VerifiedBadge from "@/app/components/admin/VerifiedBadge";
import { AdminVerificationActions } from "@/app/components/admin/AdminVerificationControls";

type Props = {
  breeders: AdminBreederListItem[];
};

export default function AdminBreederTable({ breeders }: Props) {
  const t = useTranslations("admin.breeders");

  if (breeders.length === 0) {
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
            <th className="px-4 py-4">{t("studFarm")}</th>
            <th className="px-4 py-4">{t("owner")}</th>
            <th className="px-4 py-4">{t("location")}</th>
            <th className="px-4 py-4">{t("created")}</th>
            <th className="px-4 py-4">{t("status")}</th>
            <th className="px-4 py-4">{t("actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10 bg-[#111827]">
          {breeders.map((breeder) => (
            <tr key={breeder.id}>
              <td className="px-4 py-4">
                <div className="flex items-center gap-3 min-w-[220px]">
                  <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-[#08111F]">
                    <Image src={breeder.logoUrl} alt="" fill className="object-cover" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{breeder.name}</p>
                    <Link
                      href={`/breeders/${breeder.id}`}
                      className="text-blue-400 hover:text-blue-300 text-xs"
                    >
                      {t("publicProfile")}
                    </Link>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 text-gray-300 font-mono text-xs">{breeder.ownerReference}</td>
              <td className="px-4 py-4 text-gray-300">
                {breeder.city ? `${breeder.city}, ` : ""}
                {breeder.country}
              </td>
              <td className="px-4 py-4 text-gray-400">
                {new Date(breeder.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-4">
                {breeder.verified ? <VerifiedBadge /> : <span className="text-gray-400">{t("pending")}</span>}
              </td>
              <td className="px-4 py-4 min-w-[180px]">
                <AdminVerificationActions
                  entityLabel={breeder.name}
                  verified={breeder.verified}
                  onVerify={() => setBreederVerified(breeder.id, true)}
                  onUnverify={() => setBreederVerified(breeder.id, false)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
