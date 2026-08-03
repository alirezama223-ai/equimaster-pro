import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Navbar from "@/app/components/navbar/Navbar";
import HorseGallery from "@/app/components/horse/HorseGallery";
import HorseInfo from "@/app/components/horse/HorseInfo";
import PedigreeSection from "@/app/components/pedigree/PedigreeSection";
import HorseDescription from "@/app/components/horse/HorseDescription";
import HorseVideo from "@/app/components/horse/HorseVideo";
import ContactSeller from "@/app/components/horse/ContactSeller";
import RelatedHorses from "@/app/components/horse/RelatedHorses";
import ListingBreadcrumbs from "@/app/components/horse/ListingBreadcrumbs";
import StickyMobileContactBar from "@/app/components/horse/StickyMobileContactBar";
import ListingTrainingSummarySection from "@/app/components/marketplace/ListingTrainingSummarySection";
import ListingHealthSummarySection from "@/app/components/marketplace/ListingHealthSummarySection";
import ShareListingButton from "@/app/components/marketplace/ShareListingButton";
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
  const { listing, horse, trainingSummary, healthSummary, publicUrl } = profile;

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

  return (
    <>
      <Navbar />

      {structuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      ) : null}

      <main
        className="bg-[#081223] min-h-screen text-white pt-28 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:pb-24"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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

          <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#111827] to-[#081223] p-6 sm:p-8 mb-10">
            <p className="text-blue-400 uppercase tracking-[4px] text-xs font-semibold">
              {horse.discipline}
            </p>
            <h1 className="text-4xl sm:text-6xl font-black mt-3">{horse.name}</h1>
            <p className="mt-3 text-gray-300 text-lg">
              {horse.breed} · {horse.level} · {horse.country}
            </p>
          </section>

          <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
            <HorseGallery horse={horse} />
            <div className="space-y-4">
              <HorseInfo
                horse={horse}
                isFavorited={isFavorited}
                returnPath={returnPath}
                buyerPrefill={buyerPrefill}
                isAuthenticated={Boolean(user)}
                listingStatus={listing.status}
                pedigreeHorseId={listing.pedigree_horse_id}
              />
              <ShareListingButton
                url={publicUrl}
                title={tHorse("shareTitle", { name: horse.name })}
              />
            </div>
          </div>

          <div className="mt-16 grid gap-8 lg:grid-cols-2">
            <ListingTrainingSummarySection summary={trainingSummary} />
            <ListingHealthSummarySection summary={healthSummary} />
          </div>

          <div className="mt-16 lg:mt-20">
            <PedigreeSection
              subjectName={pedigreeSection.subjectName}
              tree={pedigreeSection.tree}
              legacy={pedigreeSection.legacy}
            />
          </div>

          <div className="mt-16 lg:mt-20">
            <HorseDescription horse={horse} />
          </div>

          <HorseVideo horse={horse} />

          <ContactSeller
            horse={horse}
            returnPath={returnPath}
            buyerPrefill={buyerPrefill}
            isAuthenticated={Boolean(user)}
          />

          <RelatedHorses
            horses={relatedResult.listings.map((row) =>
              listingRowToHorse(row, { priceOnRequestLabel: tCommon("priceOnRequest") })
            )}
            currentHorse={horse}
          />
        </div>
      </main>

      {showMobileContact && horse.listingUuid ? (
        <StickyMobileContactBar
          horseName={horse.name}
          listingId={horse.listingUuid}
          returnPath={returnPath}
          buyerPrefill={buyerPrefill}
          isAuthenticated={Boolean(user)}
          isFavorited={isFavorited}
        />
      ) : null}
    </>
  );
}
