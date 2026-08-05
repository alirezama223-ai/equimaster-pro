"use client";

import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Horse } from "@/app/data/horses";
import { getHorseDetailPath } from "@/app/lib/horse-listings";
import { findCountryByName } from "@/app/lib/constants/countries";
import MarketplaceCardFavoriteButton from "@/app/components/marketplace/MarketplaceCardFavoriteButton";
import MarketplaceCardShareButton from "@/app/components/marketplace/MarketplaceCardShareButton";
import MarketplaceCompareButton from "@/app/components/marketplace/MarketplaceCompareButton";

type Props = {
  horse: Horse;
  isFavorited?: boolean;
  featured?: boolean;
  onFavoriteChange?: (favorited: boolean) => void;
};

function Badge({ children, title }: { children: ReactNode; title?: string }) {
  return (
    <span
      title={title}
      className="inline-flex max-w-full items-center rounded-lg border border-white/10 bg-[#1a2332]/95 px-2 py-0.5 text-[11px] font-medium leading-snug text-gray-200 backdrop-blur-sm sm:px-2.5 sm:py-1 sm:text-xs"
    >
      {children}
    </span>
  );
}

function sellerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function MarketplaceListingCard({
  horse,
  isFavorited = false,
  featured = false,
  onFavoriteChange,
}: Props) {
  const t = useTranslations("marketplace");
  const detailPath = getHorseDetailPath(horse);
  const canInteract = Boolean(horse.listingUuid);
  const country = findCountryByName(horse.country);
  const sellerLabel = horse.sellerName?.trim() || horse.stableName?.trim() || "—";
  const verifiedLabel = t("horseCard.verified");

  const genderOptions = {
    Mare: t("advancedSearch.mare"),
    Stallion: t("advancedSearch.stallion"),
    Gelding: t("advancedSearch.gelding"),
  } as const;

  const genderLabel =
    genderOptions[horse.gender as keyof typeof genderOptions] ?? t("horseCard.genderUnknown");

  return (
    <article className="group min-w-0 max-w-full">
      <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f1729] shadow-[0_8px_32px_rgba(0,0,0,0.35)] transition-[transform,box-shadow,border-color] duration-300 ease-out [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:border-blue-500/30 [@media(hover:hover)]:hover:shadow-[0_20px_48px_rgba(0,0,0,0.45),0_0_0_1px_rgba(59,130,246,0.12)]">
        <Link href={detailPath} className="relative block min-w-0 overflow-hidden">
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#1a2332]">
            <Image
              src={horse.images[0]}
              alt={t("horseCard.imageAlt", { name: horse.name })}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1400px) 33vw, 420px"
              loading="lazy"
              className="object-cover object-[center_22%] transition-transform duration-500 ease-out [@media(hover:hover)]:group-hover:scale-[1.03]"
            />

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0f1729] via-transparent to-[#0f1729]/30" />

            <div className="absolute inset-x-0 top-0 flex items-start gap-2 p-3 sm:p-4">
              <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                {featured ? (
                  <Badge title={t("browse.sortOptions.featured")}>
                    <span className="mr-1 shrink-0 text-amber-400" aria-hidden="true">
                      ★
                    </span>
                    <span className="truncate">{t("browse.sortOptions.featured")}</span>
                  </Badge>
                ) : null}
                {horse.verified ? (
                  <Badge title={verifiedLabel}>
                    <span className="shrink-0 text-blue-400" aria-hidden="true">
                      ✓
                    </span>
                    <span className="sr-only">{verifiedLabel}</span>
                  </Badge>
                ) : null}
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-0 flex items-end justify-end bg-gradient-to-t from-[#0f1729] via-[#0f1729]/85 to-transparent px-3 pb-3 pt-12 sm:px-4 sm:pb-4">
              <p className="max-w-full rounded-xl border border-blue-400/35 bg-[#0f1729]/95 px-3 py-2 text-right shadow-[0_4px_24px_rgba(37,99,235,0.18)] backdrop-blur-md">
                <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-blue-300/90">
                  {t("horseCard.price")}
                </span>
                <span className="block max-w-[220px] truncate text-lg font-bold leading-tight text-white sm:max-w-none sm:text-xl">
                  {horse.price}
                </span>
              </p>
            </div>
          </div>
        </Link>

        <div className="flex min-w-0 flex-1 flex-col p-4 sm:p-5">
          <Link href={detailPath} className="min-w-0">
            <h3 className="truncate text-xl font-bold leading-tight tracking-tight text-white transition-colors duration-200 [@media(hover:hover)]:group-hover:text-blue-300 sm:text-2xl">
              {horse.name}
            </h3>
            <p className="mt-1 truncate text-sm text-gray-400">{horse.breed}</p>
          </Link>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge>{t("horseCard.ageValue", { age: horse.age })}</Badge>
            <Badge>{t("horseCard.heightValue", { height: horse.height })}</Badge>
            {horse.level ? (
              <Badge title={t("horseCard.level")}>{horse.level}</Badge>
            ) : null}
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <InfoRow label={t("horseCard.gender")} value={genderLabel} />
            <InfoRow label={t("browse.discipline")} value={horse.discipline} />
            <InfoRow
              label={t("horseCard.location")}
              value={
                country ? (
                  <span className="inline-flex min-w-0 items-center gap-1.5">
                    <span className="shrink-0" aria-hidden="true">
                      {country.flag}
                    </span>
                    <span className="truncate">{horse.country}</span>
                  </span>
                ) : (
                  horse.country
                )
              }
              className="col-span-2"
            />
          </dl>

          <div className="mt-4 flex min-w-0 items-center gap-3 rounded-xl border border-white/[0.06] bg-[#131d30]/80 px-3 py-2.5">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600/80 to-blue-800/80 text-xs font-bold text-white ring-2 ring-white/10"
              aria-hidden="true"
            >
              {sellerInitials(sellerLabel)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{sellerLabel}</p>
              <div className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                {horse.verified ? (
                  <span className="inline-flex min-w-0 max-w-[46%] shrink-0 items-center gap-1 text-[11px] font-medium text-blue-300 sm:max-w-none">
                    <span aria-hidden="true">✓</span>
                    <span className="truncate">{verifiedLabel}</span>
                  </span>
                ) : null}
                {country ? (
                  <span className="inline-flex min-w-0 items-center gap-1 truncate text-[11px] text-gray-400">
                    <span className="shrink-0" aria-hidden="true">
                      {country.flag}
                    </span>
                    <span className="truncate">{horse.country}</span>
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-4">
            <MarketplaceCardFavoriteButton
              listingId={horse.listingUuid ?? ""}
              initialFavorited={isFavorited}
              returnPath={detailPath}
              disabled={!canInteract}
              onChange={onFavoriteChange}
            />
            <MarketplaceCardShareButton url={detailPath} title={horse.name} />
            <MarketplaceCompareButton
              listingId={horse.listingUuid ?? ""}
              name={horse.name}
              disabled={!canInteract}
            />
          </div>

          <Link
            href={detailPath}
            className="mt-3 flex w-full min-h-11 items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors duration-200 [@media(hover:hover)]:hover:bg-blue-500"
          >
            {t("horseCard.view")}
          </Link>
        </div>
      </div>
    </article>
  );
}

function InfoRow({
  label,
  value,
  className = "",
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <dt className="text-[10px] font-medium uppercase tracking-wider text-gray-500">{label}</dt>
      <dd className="mt-0.5 truncate font-medium text-gray-200">{value}</dd>
    </div>
  );
}
