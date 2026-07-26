"use client";

import Link from "next/link";
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
  if (records.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 px-6 py-12 text-center text-gray-500">
        No pedigree records match this filter.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-3xl border border-white/10">
      <table className="min-w-full divide-y divide-white/10 text-sm">
        <thead className="bg-[#0B1424] text-left text-gray-400 uppercase tracking-wide text-xs">
          <tr>
            <th className="px-4 py-4">Horse</th>
            <th className="px-4 py-4">Identity</th>
            <th className="px-4 py-4">Created</th>
            <th className="px-4 py-4">Status</th>
            <th className="px-4 py-4">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10 bg-[#111827]">
          {records.map((record) => (
            <tr key={record.id}>
              <td className="px-4 py-4">
                <p className="font-semibold text-white">{record.name}</p>
                <Link href={`/pedigree/${record.id}`} className="text-blue-400 hover:text-blue-300 text-xs">
                  View profile →
                </Link>
              </td>
              <td className="px-4 py-4 text-gray-300">
                <p>{record.identityLine}</p>
                {record.registrationNumber ? (
                  <p className="text-xs text-gray-500 mt-1">UELN/Reg: {record.registrationNumber}</p>
                ) : null}
              </td>
              <td className="px-4 py-4 text-gray-400">
                {new Date(record.createdAt).toLocaleDateString()}
              </td>
              <td className="px-4 py-4">
                {record.verified ? <VerifiedBadge /> : <span className="text-gray-400">Pending</span>}
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
