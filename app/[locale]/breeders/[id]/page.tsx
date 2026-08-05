import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Navbar from "@/app/components/navbar/Navbar";
import StallionCard from "@/app/components/stallions/StallionCard";
import SellerProfileHeader, {
  SellerProfileSection,
} from "@/app/components/breeders/profile/SellerProfileHeader";
import SellerTrustCards from "@/app/components/breeders/profile/SellerTrustCards";
import SellerProfileGallery from "@/app/components/breeders/profile/SellerProfileGallery";
import SellerListingsGrid from "@/app/components/breeders/profile/SellerListingsGrid";
import SellerContactSidebar, {
  StickyMobileSellerContactBar,
} from "@/app/components/breeders/profile/SellerContactSidebar";
import SellerLocationSection from "@/app/components/breeders/profile/SellerLocationSection";
import HorseSectionEmpty from "@/app/components/horse/HorseSectionEmpty";
import { isBreederUuid } from "@/app/lib/breeders";
import { getCachedBreederById } from "@/app/lib/entity-profile-cache";
import { listingRowToHorse, getListingCoverImageUrl } from "@/app/lib/horse-listings";
import {
  buildBreederMetadata,
  buildBreederOrganizationJsonLd,
  loadEntitySeoTemplates,
} from "@/app/lib/seo/entity-metadata";
import { getUserFavoriteListingIds } from "@/app/actions/favorites";
import { type AppLocale, routing } from "@/i18n/routing";
import type { HorseListingRow } from "@/app/types/horse-listing";
import type { StallionCardData } from "@/app/types/stallion";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string; locale: string }>;
};

function formatMemberSince(isoDates: string[]): string | null {
  const timestamps = isoDates
    .map((value) => new Date(value).getTime())
    .filter((value) => !Number.isNaN(value));

  if (timestamps.length === 0) return null;

  const oldest = new Date(Math.min(...timestamps));
  return `Member since ${oldest.toLocaleDateString(undefined, { month: "long", year: "numeric" })}`;
}

function buildGalleryImages(
  logoUrl: string,
  coverImageUrl: string,
  stallions: StallionCardData[],
  listings: HorseListingRow[]
): string[] {
  const images = [
    coverImageUrl,
    logoUrl,
    ...stallions.map((stallion) => stallion.coverImageUrl),
    ...listings.map((row) => getListingCoverImageUrl(row)),
  ];

  return [...new Set(images.filter((url) => url?.trim()))];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params;

  if (!isBreederUuid(id)) {
    return { robots: { index: false, follow: false } };
  }

  const result = await getCachedBreederById(id);

  if (!result.breeder) {
    return { robots: { index: false, follow: false } };
  }

  const tMeta = await getTranslations("metadata");
  const resolvedLocale = routing.locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : routing.defaultLocale;

  return buildBreederMetadata(
    result.breeder,
    resolvedLocale,
    tMeta("listing.siteName"),
    loadEntitySeoTemplates(tMeta, "breeder")
  );
}

export default async function BreederDetailPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("breeders");
  const tCommon = await getTranslations("common");
  const tMarketplace = await getTranslations("marketplace");

  if (!isBreederUuid(id)) {
    notFound();
  }

  const [result, favoriteListingIds] = await Promise.all([
    getCachedBreederById(id),
    getUserFavoriteListingIds(),
  ]);

  if (!result.breeder) {
    notFound();
  }

  const { breeder, stallions, listings } = result;
  const listingRows = (listings ?? []) as HorseListingRow[];
  const listingHorses = listingRows.map((row) =>
    listingRowToHorse(row, { priceOnRequestLabel: tCommon("priceOnRequest") })
  );
  const profilePath = `/breeders/${id}`;
  const memberSinceLabel = formatMemberSince(listingRows.map((row) => row.created_at));
  const galleryImages = buildGalleryImages(
    breeder.logoUrl,
    breeder.coverImageUrl,
    stallions,
    listingRows
  );

  const trustMetrics = [
    listingHorses.length > 0
      ? {
          key: "listings",
          label: t("detail.horsesForSale"),
          value: String(listingHorses.length),
          accent: "blue" as const,
        }
      : null,
    stallions.length > 0
      ? {
          key: "stallions",
          label: t("detail.stallions"),
          value: String(stallions.length),
          accent: "violet" as const,
        }
      : null,
    breeder.verified
      ? {
          key: "verified",
          label: tMarketplace("horseCard.verified"),
          value: "✓",
          accent: "emerald" as const,
        }
      : null,
  ].filter(Boolean) as {
    key: string;
    label: string;
    value: string;
    accent?: "blue" | "emerald" | "violet" | "amber";
  }[];

  const organizationJsonLd = buildBreederOrganizationJsonLd(breeder);
  const hasContact = Boolean(breeder.email?.trim() || breeder.phone?.trim() || breeder.website?.trim());

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <Navbar />

      <main className="min-h-screen overflow-x-hidden bg-[#081223] text-white pt-28 pb-[calc(10rem+env(safe-area-inset-bottom))] lg:pb-24">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-5 lg:px-6">
          <SellerProfileHeader
            breeder={breeder}
            memberSinceLabel={memberSinceLabel}
            sellerTypeLabel="Breeder / Stud Farm"
            coverAlt={t("detail.coverAlt", { name: breeder.name })}
            logoAlt={t("detail.logoAlt", { name: breeder.name })}
          />

          {trustMetrics.length > 0 ? (
            <div className="mt-8">
              <SellerTrustCards metrics={trustMetrics} />
            </div>
          ) : null}

          <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-12 xl:gap-16">
            <div className="min-w-0 space-y-8 lg:space-y-10">
              {breeder.description ? (
                <SellerProfileSection id="about" title={t("detail.about")}>
                  <div className="max-w-3xl text-base leading-[1.85] text-gray-300 sm:text-lg sm:leading-[1.9] whitespace-pre-wrap">
                    {breeder.description}
                  </div>
                </SellerProfileSection>
              ) : null}

              {listingHorses.length > 0 ? (
                <SellerProfileSection id="horses" title={t("detail.horsesForSale")}>
                  <SellerListingsGrid
                    horses={listingHorses}
                    favoriteListingIds={favoriteListingIds}
                  />
                </SellerProfileSection>
              ) : null}

              {stallions.length > 0 ? (
                <SellerProfileSection id="stallions" title={t("detail.stallions")}>
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                    {stallions.map((stallion) => (
                      <StallionCard key={stallion.id} stallion={stallion} />
                    ))}
                  </div>
                </SellerProfileSection>
              ) : null}

              {breeder.disciplines.length > 0 ? (
                <SellerProfileSection
                  id="breeding"
                  title="Breeding Program"
                  subtitle={t("detail.contactDescription", { name: breeder.name })}
                >
                  <div className="flex items-start gap-4 rounded-xl border border-white/[0.06] bg-gradient-to-br from-[#132038]/80 to-[#0a1220] p-5 sm:p-6">
                    <span
                      aria-hidden="true"
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-violet-500/25 bg-violet-600/10 text-2xl"
                    >
                      🧬
                    </span>
                    <div className="min-w-0">
                      <p className="text-lg font-semibold text-white">{breeder.name}</p>
                      <p className="mt-2 text-sm leading-relaxed text-gray-400">
                        {breeder.disciplines.join(" · ")}
                      </p>
                    </div>
                  </div>
                </SellerProfileSection>
              ) : null}

              {galleryImages.length > 2 ? (
                <SellerProfileSection id="gallery" title="Gallery">
                  <SellerProfileGallery images={galleryImages} sellerName={breeder.name} />
                </SellerProfileSection>
              ) : null}

              <SellerLocationSection breeder={breeder} title={t("directory.countryLabel")} />

              <SellerProfileSection id="reviews" title="Reviews">
                <HorseSectionEmpty message="Reviews have not been published for this seller yet." />
              </SellerProfileSection>
            </div>

            <SellerContactSidebar
              breederId={id}
              breederName={breeder.name}
              profilePath={profilePath}
              email={breeder.email}
              phone={breeder.phone}
              website={breeder.website}
              contactTitle={t("detail.contact")}
              contactDescription={t("detail.contactDescription", { name: breeder.name })}
              viewListingsLabel={t("detail.horsesForSale")}
              shareLabel={tMarketplace("share.label")}
              shareCopiedLabel={tMarketplace("share.copied")}
              websiteLabel={t("detail.website")}
              noContactLabel={t("detail.noContactDetails")}
            />
          </div>

          <div className="mt-10">
            <Link href="/breeders" className="text-sm text-gray-400 transition hover:text-white">
              {t("detail.backToDirectory")}
            </Link>
          </div>
        </div>
      </main>

      {hasContact || listingHorses.length > 0 ? (
        <StickyMobileSellerContactBar
          breederId={id}
          breederName={breeder.name}
          profilePath={profilePath}
          email={breeder.email}
          contactTitle={t("detail.contact")}
          viewListingsLabel={t("detail.horsesForSale")}
          shareLabel={tMarketplace("share.label")}
        />
      ) : null}
    </>
  );
}
