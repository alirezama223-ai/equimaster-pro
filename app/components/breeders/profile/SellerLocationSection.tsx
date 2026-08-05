import { findCountryByName } from "@/app/lib/constants/countries";
import { SellerProfileSection } from "@/app/components/breeders/profile/SellerProfileHeader";
import type { BreederProfileDetail } from "@/app/types/breeder";

type Props = {
  breeder: BreederProfileDetail;
  title: string;
};

export default function SellerLocationSection({ breeder, title }: Props) {
  const country = findCountryByName(breeder.country);

  return (
    <SellerProfileSection id="location" title={title}>
      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Country</p>
          <p className="mt-2 inline-flex items-center gap-2 text-lg font-semibold text-white">
            {country ? <span aria-hidden="true">{country.flag}</span> : null}
            {breeder.country}
          </p>
          {breeder.city ? (
            <>
              <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                Region
              </p>
              <p className="mt-2 text-lg font-semibold text-white">{breeder.city}</p>
            </>
          ) : null}
        </div>

        <div className="flex min-h-[180px] items-center justify-center rounded-xl border border-dashed border-white/10 bg-gradient-to-br from-[#111827] to-[#0a1220] p-6 text-center">
          <div>
            <p className="text-3xl opacity-40" aria-hidden="true">
              ⌖
            </p>
            <p className="mt-3 text-sm text-gray-500">Map preview unavailable</p>
          </div>
        </div>
      </div>
    </SellerProfileSection>
  );
}
