import VerifiedBadge from "@/app/components/verification/VerifiedBadge";
import { getTranslations } from "next-intl/server";
import { Horse } from "@/app/data/horses";
import { findCountryByName } from "@/app/lib/constants/countries";

type Props = { horse: Horse; publishedAt: string | null; memberSince: string | null };

function sellerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function formatMemberSince(isoDate: string | null): string | null {
  if (!isoDate) return null;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export default async function HorseSellerCard({ horse, publishedAt, memberSince }: Props) {
  const t = await getTranslations("horse");
  const sellerLabel = horse.sellerName?.trim() || horse.stableName?.trim();
  const country = findCountryByName(horse.country);
  const memberSinceLabel = formatMemberSince(memberSince);
  const publishedLabel = formatMemberSince(publishedAt);
  if (!sellerLabel) return null;

  return (
    <section className="rounded-2xl border border-[#D4A437]/15 bg-[#0f1729]/90 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.22)] sm:p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#F7E1A1]">{t("contact.contactSeller")}</p>
      <div className="mt-4 flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0B1E3A] to-[#D4A437]/80 text-base font-bold text-white ring-2 ring-[#D4A437]/20 shadow-lg" aria-hidden="true">
          {sellerInitials(sellerLabel)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold text-white">{sellerLabel}</h3>
          {horse.stableName && horse.sellerName ? <p className="mt-0.5 truncate text-sm text-gray-400">{horse.stableName}</p> : null}
          <div className="mt-2 space-y-1">
            {country ? <p className="inline-flex items-center gap-1.5 text-sm text-gray-400"><span aria-hidden="true">{country.flag}</span>{horse.country}</p> : null}
            {memberSinceLabel ? <p className="text-sm text-gray-500">Member since {memberSinceLabel}</p> : null}
            {publishedLabel && !memberSinceLabel ? <p className="text-sm text-gray-500">Listed {publishedLabel}</p> : null}
          </div>
          {horse.sellerVerified ? <div className="mt-3"><VerifiedBadge label="seller" /></div> : null}
        </div>
      </div>
    </section>
  );
}
