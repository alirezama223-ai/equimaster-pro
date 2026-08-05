import type { ReactNode } from "react";
import Image from "next/image";
import VerifiedBadge from "@/app/components/admin/VerifiedBadge";
import { findCountryByName } from "@/app/lib/constants/countries";
import type { BreederProfileDetail } from "@/app/types/breeder";

type Props = {
  breeder: BreederProfileDetail;
  memberSinceLabel: string | null;
  sellerTypeLabel: string;
  coverAlt: string;
  logoAlt: string;
};

export default function SellerProfileHeader({
  breeder,
  memberSinceLabel,
  sellerTypeLabel,
  coverAlt,
  logoAlt,
}: Props) {
  const country = findCountryByName(breeder.country);
  const locationLabel = breeder.city ? `${breeder.city}, ${breeder.country}` : breeder.country;

  return (
    <header className="relative overflow-hidden rounded-2xl border border-white/[0.08] shadow-[0_16px_48px_rgba(0,0,0,0.35)]">
      <div className="relative aspect-[21/9] min-h-[220px] w-full sm:min-h-[280px]">
        <Image
          src={breeder.coverImageUrl}
          alt={coverAlt}
          fill
          priority
          sizes="(max-width: 1400px) 100vw, 1400px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#081223] via-[#081223]/55 to-[#081223]/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#081223]/40 via-transparent to-[#081223]/30" />
      </div>

      <div className="relative px-4 pb-6 pt-0 sm:px-6 sm:pb-8">
        <div className="-mt-14 flex flex-col gap-5 sm:-mt-16 sm:flex-row sm:items-end sm:gap-6">
          <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-4 border-[#081223] bg-[#111827] shadow-[0_12px_40px_rgba(0,0,0,0.45)] sm:h-32 sm:w-32">
            <Image src={breeder.logoUrl} alt={logoAlt} fill sizes="128px" className="object-cover" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-gray-300">
                {sellerTypeLabel}
              </span>
              {breeder.verified ? <VerifiedBadge /> : null}
            </div>

            <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
              {breeder.name}
            </h1>

            <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-base text-gray-300">
              {country ? (
                <span className="inline-flex items-center gap-1.5">
                  <span aria-hidden="true">{country.flag}</span>
                  {locationLabel}
                </span>
              ) : (
                locationLabel
              )}
              {memberSinceLabel ? (
                <>
                  <span aria-hidden="true" className="text-gray-600">
                    ·
                  </span>
                  <span className="text-gray-400">{memberSinceLabel}</span>
                </>
              ) : null}
            </p>

            {breeder.disciplines.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {breeder.disciplines.map((discipline) => (
                  <span
                    key={discipline}
                    className="rounded-full border border-blue-500/20 bg-blue-600/10 px-3 py-1 text-xs font-medium text-blue-200"
                  >
                    {discipline}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

export function SellerProfileSection({
  id,
  title,
  subtitle,
  children,
  className = "",
}: {
  id: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`scroll-mt-28 rounded-2xl border border-white/[0.08] bg-[#0f1729]/60 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.22)] sm:p-6 lg:p-8 ${className}`}
    >
      <div className="mb-5 sm:mb-6">
        <h2 id={`${id}-heading`} className="text-xl font-bold text-white sm:text-2xl">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-400 sm:text-base">
            {subtitle}
          </p>
        ) : null}
      </div>
      {children}
    </section>
  );
}
