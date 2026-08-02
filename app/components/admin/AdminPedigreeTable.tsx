"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { setPedigreeHorseVerified } from "@/app/actions/pedigree";
import VerifiedBadge from "@/app/components/admin/VerifiedBadge";
import { AdminVerificationActions } from "@/app/components/admin/AdminVerificationControls";

export type AdminPedigreeRecord = {
  id: string;
  name: string;
  sex: string;
  birthYear: number | null;
  studbook: string | null;
  registrationNumber: string | null;
  verified: boolean;
  createdAt: string;
  identityLine: string;
};

type Props = {
  records: AdminPedigreeRecord[];
};

export default function AdminPedigreeTable({ records }: Props) {
  const t = useTranslations("admin.pedigree");

  if (records.length === 0) {
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
            <th className="px-4 py-4">{t("horse")}</th>
            <th className="px-4 py-4">{t("identity")}</th>
            <th className="px-4 py-4">{t("created")}</th>
            <th className="px-4 py-4">{t("status")}</th>
            <th className="px-4 py-4">{t("actions")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10 bg-[#111827]">
          {records.map((record) => (
            <tr key={record.id}>
              <td className="px-4 py-4">
                <p className="font-semibold text-white">{record.name}</p>
                <Link href={`/pedigree/${record.id}`} className="text-blue-400 hover:text-blue-300 text-xs">
                  {t("viewProfile")}
                </Link>
              </td>
              <td className="px-4 py-4 text-gray-300">
                <p>{record.identityLine}</p>
                {record.registrationNumber ? (
                  <p className="text-xs text-gray-500 mt-1">
                    {t("registration", { number: record.registrationNumber })}
                  </p>
                ) : null}
              </td>
              <td className="px-4 py-4 text-gray-400">
                {new Date(record.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-4">
                {record.verified ? <VerifiedBadge /> : <span className="text-gray-400">{t("pending")}</span>}
              </td>
              <td className="px-4 py-4 min-w-[180px]">
                <AdminVerificationActions
                  entityLabel={record.name}
                  verified={record.verified}
                  onVerify={() => setPedigreeHorseVerified(record.id, true)}
                  onUnverify={() => setPedigreeHorseVerified(record.id, false)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
