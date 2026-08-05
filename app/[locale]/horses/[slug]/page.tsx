import nextDynamic from "next/dynamic";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Navbar from "@/app/components/navbar/Navbar";
import HorseListingHeader from "@/app/components/horse/HorseListingHeader";
import HorseQuickFacts from "@/app/components/horse/HorseQuickFacts";
import HorseBloodlineVisual from "@/app/components/horse/HorseBloodlineVisual";
import HorseDescription from "@/app/components/horse/HorseDescription";
import HorseVideo from "@/app/components/horse/HorseVideo";
import HorseListingSidebar from "@/app/components/horse/HorseListingSidebar";
import HorseSellerCard from "@/app/components/horse/HorseSellerCard";
import RelatedHorses from "@/app/components/horse/RelatedHorses";
import HorseLocationSection from "@/app/components/horse/HorseLocationSection";
import HorseDocumentsSection from "@/app/components/horse/HorseDocumentsSection";
import HorseDetailSectionNav from "@/app/components/horse/HorseDetailSectionNav";
import ListingBreadcrumbs from "@/app/components/horse/ListingBreadcrumbs";
import StickyMobileContactBar from "@/app/components/horse/StickyMobileContactBar";
import ListingTrainingSummarySection from "@/app/components/marketplace/ListingTrainingSummarySection";
import ListingHealthSummarySection from "@/app/components/marketplace/ListingHealthSummarySection";
import PedigreeSection from "@/app/components/pedigree/PedigreeSection";
import {
  HorseGallerySkeleton,
  HorseSellerCardSkeleton,
  HorseSidebarSkeleton,
  RelatedHorsesSkeleton,
} from "@/app/components/horse/HorseDetailSkeletons";
import { buildPublicListingProfileBySlug } from "@/app/lib/marketplace/listing-display";
import { getCachedPublicListingProfileBySlug } from "@/app/lib/marketplace/listing-profile-cache";
import {
  buildHorseListingMetadata,
  buildHorseListingStructuredData,
} from "@/app/lib/marketplace/seo";
import { loadEntitySeoTemplates } from "@/app/lib/seo/entity-metadata";
import { buildMarketplaceSearchQuery } from "@/app/lib/marketplace/search";
import { listingRowToHorse } from "@/app/lib/horse-listings";
import { getPedigreeSectionForListing } from "@/app/actions/pedigree";
import { incrementListingViewCount } from "@/app/actions/horse-listings";
import { getRelatedActiveListings } from "@/app/actions/marketplace";
import { getUserFavoriteListingIds } from "@/app/actions/favorites";
import { createClient } from "@/app/lib/supabase/server";
import { type AppLocale, routing } from "@/i18n/routing";

const HorseGallery = nextDynamic(() => import("@/app/components/horse/HorseGallery"), {
  loading: () => <HorseGallerySkeleton />,
});

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string; locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, locale } = await params;
  const t = await getTranslations("marketplace");
  const tMeta = await getTranslations("metadata");
  const result = await getCachedPublicListingProfileBySlug(slug);

  if (!result.profile || result.profile.listing.status !== "active") {
    return {
      title: result.profile?.horse.name ?? t("listingPage.defaultTitle"),
      robots: { index: false, follow: false },
    };
  }

  const resolvedLocale = routing.locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : routing.defaultLocale;

  return buildHorseListingMetadata(result.profile.listing, resolvedLocale, {
    siteName: tMeta("listing.siteName"),
    imageAltTemplate: tMeta("listing.imageAlt"),
    templates: loadEntitySeoTemplates(tMeta, "horse"),
  });
}

export default async function PublicHorseListingPage({ params }: Props) {
  const { slug } = await params;
  const t = await getTranslations("marketplace");
  const tCommon = await getTranslations("common");
  const tHorse = await getTranslations("horse");
  const tPedigree = await getTranslations("pedigree");
  const tNav = await getTranslations("nav");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let result = await getCachedPublicListingProfileBySlug(slug);

  if (!result.profile && user?.id) {
    result = await buildPublicListingProfileBySlug(supabase, slug, {
      ownerUserId: user.id,
    });
  }

  if (!result.profile) {
    notFound();
  }

  const { profile, isOwnerPreview } = result;
  const { listing, horse, pedigreeHorse, trainingSummary, healthSummary, publicUrl } = profile;

  if (listing.status === "active") {
    await incrementListingViewCount(slug);
  }

  const [favoriteListingIds, relatedResult, pedigreeSection] = await Promise.all([
    getUserFavoriteListingIds(),
    getRelatedActiveListings(listing.id, listing.discipline),
    getPedigreeSectionForListing(listing),
  ]);

  const isFavorited = favoriteListingIds.includes(listing.id);
  const returnPath = publicUrl;
  const buyerPrefill = user
    ? {
        buyerName: (user.user_metadata?.full_name as string | undefined)?.trim() || "",
        buyerEmail: user.email ?? "",
      }
    : undefined;

  const structuredData =
    listing.status === "active"
      ? buildHorseListingStructuredData(listing, {
          home: tNav("home"),
          marketplace: t("listingPage.breadcrumbMarketplace"),
        })
      : null;

  const breedBrowseHref = `/horses${buildMarketplaceSearchQuery({ breed: horse.breed })}`;

  const showMobileContact =
    listing.status === "active" && Boolean(horse.listingUuid);

  const legacyPedigree = pedigreeSection.legacy ?? {
    sire: horse.sire,
    dam: horse.dam,
    damSire: horse.damSire ?? "",
  };

  const hasLegacyPedigree = Boolean(
    legacyPedigree.sire.trim() || legacyPedigree.dam.trim() || legacyPedigree.damSire.trim()
  );

  const sectionNav = [
    { id: "overview", label: tHorse("info.breed") },
    { id: "description", label: tHorse("description.title") },
    { id: "pedigree", label: tPedigree("section.title") },
    { id: "health", label: t("healthSummary.title") },
    { id: "location", label: tHorse("info.country") },
    { id: "documents", label: tPedigree("profile.registration") },
  ];

  return (
    <>
      <Navbar />

      {structuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      ) : null}

      <main className="min-h-screen overflow-x-hidden bg-[#081223] text-white pt-28 pb-[calc(10rem+env(safe-area-inset-bottom))] lg:pb-24">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-5 lg:px-6">
          <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
            <ListingBreadcrumbs
              horseName={horse.name}
              breed={horse.breed}
              breedHref={breedBrowseHref}
              ariaLabel={tHorse("breadcrumbs.ariaLabel")}
              homeLabel={tNav("home")}
              marketplaceLabel={t("listingPage.breadcrumbMarketplace")}
            />

            {isOwnerPreview ? (
              <div className="rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs uppercase tracking-wide text-amber-100">
                {t("ownerPreview", {
                  status:
                    {
                      active: t("sellerDashboard.statusLabels.active"),
                      draft: t("sellerDashboard.statusLabels.draft"),
                      sold: t("sellerDashboard.statusLabels.sold"),
                      archived: t("sellerDashboard.statusLabels.archived"),
                    }[listing.status] ?? listing.status,
                })}
              </div>
            ) : null}
          </div>

          <Suspense fallback={<HorseGallerySkeleton />}>
            <HorseGallery horse={horse} />
          </Suspense>

          <div className="mt-8 lg:mt-10">
            <HorseListingHeader
              horse={horse}
              healthSummary={healthSummary}
              pedigreeHorseId={listing.pedigree_horse_id}
              pedigreeHorse={pedigreeHorse}
              hasLegacyPedigree={hasLegacyPedigree}
            />
          </div>

          <HorseDetailSectionNav sections={sectionNav} />

          <div className="mt-8 grid gap-10 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12 xl:gap-16">
            <div className="min-w-0 space-y-8 lg:space-y-10">
              <HorseQuickFacts horse={horse} pedigreeHorse={pedigreeHorse} />

              <HorseDescription horse={horse} />

              <HorseBloodlineVisual subjectName={horse.name} legacy={legacyPedigree} />

              {pedigreeSection.tree ? (
                <PedigreeSection
                  subjectName={pedigreeSection.subjectName}
                  tree={pedigreeSection.tree}
                  legacy={pedigreeSection.legacy}
                  hideLegacy
                />
              ) : null}

              <ListingHealthSummarySection summary={healthSummary} />

              <ListingTrainingSummarySection summary={trainingSummary} />

              <HorseLocationSection horse={horse} />

              <HorseDocumentsSection pedigreeHorse={pedigreeHorse} />

              <HorseVideo horse={horse} />
            </div>

            <div className="min-w-0 space-y-5">
              <Suspense fallback={<HorseSidebarSkeleton />}>
                <HorseListingSidebar
                  horseName={horse.name}
                  price={horse.price}
                  listingId={horse.listingUuid}
                  returnPath={returnPath}
                  publicUrl={publicUrl}
                  buyerPrefill={buyerPrefill}
                  isAuthenticated={Boolean(user)}
                  isFavorited={isFavorited}
                  listingStatus={listing.status}
                  pedigreeHorseId={listing.pedigree_horse_id}
                  contactUnavailableLabel={tHorse("info.contactUnavailable")}
                  draftContactLabel={tHorse("info.draftContact")}
                  viewPedigreeLabel={tHorse("info.viewPedigree")}
                  askingPriceLabel={tHorse("info.askingPrice")}
                />
              </Suspense>

              <Suspense fallback={<HorseSellerCardSkeleton />}>
                <HorseSellerCard
                  horse={horse}
                  publishedAt={listing.published_at}
                  memberSince={listing.created_at}
                />
              </Suspense>
            </div>
          </div>

          <Suspense fallback={<RelatedHorsesSkeleton />}>
            <RelatedHorses
              horses={relatedResult.listings.map((row) =>
                listingRowToHorse(row, { priceOnRequestLabel: tCommon("priceOnRequest") })
              )}
              currentHorse={horse}
              favoriteListingIds={favoriteListingIds}
            />
          </Suspense>
        </div>
      </main>

      {showMobileContact && horse.listingUuid ? (
        <StickyMobileContactBar
          horseName={horse.name}
          price={horse.price}
          listingId={horse.listingUuid}
          returnPath={returnPath}
          publicUrl={publicUrl}
          buyerPrefill={buyerPrefill}
          isAuthenticated={Boolean(user)}
          isFavorited={isFavorited}
          contactLabel={tHorse("contact.contactSeller")}
        />
      ) : null}
    </>
  );
}
