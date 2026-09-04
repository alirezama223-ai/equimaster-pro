import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import Navbar from "@/app/components/navbar/Navbar";
import VerifiedBadge from "@/app/components/admin/VerifiedBadge";
import EntityGallery from "@/app/components/shared/EntityGallery";
import PedigreeSection from "@/app/components/pedigree/PedigreeSection";
import TraitProfileSection from "@/app/components/traits/TraitProfileSection";
import StallionContact from "@/app/components/stallions/StallionContact";
import { getPedigreeSectionForStallion } from "@/app/actions/pedigree";
import { getHorseTraitProfile } from "@/app/actions/traits";
import { getCachedStallionById } from "@/app/lib/entity-profile-cache";
import {
  availabilityBadgeClass,
  getStallionAge,
  isStallionUuid,
} from "@/app/lib/stallions";
import {
  buildStallionJsonLd,
  buildStallionMetadata,
  loadEntitySeoTemplates,
} from "@/app/lib/seo/entity-metadata";
import { type AppLocale, routing } from "@/i18n/routing";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string; locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id, locale } = await params;

  if (!isStallionUuid(id)) {
    return {
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const { stallion } = await getCachedStallionById(id);

  if (!stallion) {
    return {
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const tMeta = await getTranslations("metadata");

  const resolvedLocale = routing.locales.includes(locale as AppLocale)
    ? (locale as AppLocale)
    : routing.defaultLocale;

  return buildStallionMetadata(
    stallion,
    resolvedLocale,
    tMeta("listing.siteName"),
    loadEntitySeoTemplates(tMeta, "stallion")
  );
}

export default async function StallionDetailPage({ params }: Props) {
  const { id } = await params;
  const t = await getTranslations("stallions");

  if (!isStallionUuid(id)) {
    notFound();
  }

  const { stallion, pedigreeHorseId } = await getCachedStallionById(id);

  if (!stallion) {
    notFound();
  }

  const stallionJsonLd = buildStallionJsonLd(stallion);

  const age = getStallionAge(stallion.birthYear);
  const emptyValue = t("detail.emptyValue");

  const pedigreeSection = await getPedigreeSectionForStallion({
    pedigree_horse_id: pedigreeHorseId,
    name: stallion.name,
    sire: stallion.sire,
    dam: stallion.dam,
    dam_sire: stallion.damSire,
  });

  const traitResult = pedigreeHorseId
    ? await getHorseTraitProfile(pedigreeHorseId)
    : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(stallionJsonLd),
        }}
      />

      <Navbar />

      <main className="bg-[#081223] min-h-screen text-white pt-28 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <Link
              href="/stallions"
              className="text-gray-400 hover:text-white transition"
            >
              {t("detail.backToDirectory")}
            </Link>
          </div>

          <div className="mb-10 relative h-52 sm:h-64 md:h-80 overflow-hidden rounded-3xl border border-white/10 bg-[#0f1729]">
            <Image
              src={stallion.coverImageUrl}
              alt={t("detail.coverAlt", {
                name: stallion.name,
              })}
              fill
              priority
              className="object-contain object-center"
            />

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#081223] via-black/20 to-transparent" />
          </div>

          <div className="grid lg:grid-cols-2 gap-16">
            <EntityGallery
              images={stallion.images}
              altPrefix={stallion.name}
            />

            <div>
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {stallion.verified ? <VerifiedBadge /> : null}

                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold ${availabilityBadgeClass(
                    stallion.availability
                  )}`}
                >
                  {t(`availability.${stallion.availability}`)}
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-black">
                {stallion.name}
              </h1>

              <p className="mt-3 text-xl text-gray-400">
                {stallion.breed}
                {stallion.studbook ? ` · ${stallion.studbook}` : ""}
              </p>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <DetailItem
                  label={t("detail.birthYear")}
                  value={
                    stallion.birthYear?.toString() ?? emptyValue
                  }
                />

                <DetailItem
                  label={t("detail.age")}
                  value={
                    age !== null
                      ? t("detail.ageValue", { age })
                      : emptyValue
                  }
                />

                <DetailItem
                  label={t("detail.color")}
                  value={stallion.color || emptyValue}
                />

                <DetailItem
                  label={t("detail.height")}
                  value={
                    stallion.height
                      ? t("detail.heightValue", {
                          height: stallion.height,
                        })
                      : emptyValue
                  }
                />

                <DetailItem
                  label={t("detail.country")}
                  value={stallion.country}
                />

                <DetailItem
                  label={t("detail.discipline")}
                  value={stallion.discipline}
                />

                <DetailItem
                  label={t("detail.competitionLevel")}
                  value={
                    stallion.competitionLevel || emptyValue
                  }
                />

                <DetailItem
                  label={t("detail.studFee")}
                  value={stallion.studFeeLabel}
                />
              </div>

              <div className="mt-8 flex flex-wrap gap-4">
                {pedigreeHorseId ? (
                  <Link
                    href={`/breeding-lab?stallion=${pedigreeHorseId}`}
                    className="rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500 transition"
                  >
                    {t("detail.useInBreedingLab")}
                  </Link>
                ) : (
                  <Link
                    href={`/breeding-lab?stallionDirectory=${id}`}
                    className="rounded-xl bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-500 transition"
                  >
                    {t("detail.useInBreedingLab")}
                  </Link>
                )}

                {pedigreeHorseId ? (
                  <Link
                    href={`/pedigree/${pedigreeHorseId}`}
                    className="rounded-xl border border-white/15 px-5 py-3 font-semibold hover:border-blue-500 transition"
                  >
                    {t("detail.viewFullPedigree")}
                  </Link>
                ) : null}
              </div>

              <div className="mt-8 rounded-2xl border border-white/10 bg-[#111827] p-6">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {t("detail.studFarm")}
                </p>

                <Link
                  href={`/breeders/${stallion.breeder.id}`}
                  className="mt-2 inline-block text-xl font-bold text-blue-400 hover:text-blue-300"
                >
                  {stallion.breeder.name}
                </Link>

                <p className="mt-1 text-gray-400">
                  📍{" "}
                  {stallion.breeder.city
                    ? `${stallion.breeder.city}, `
                    : ""}
                  {stallion.breeder.country}
                </p>
              </div>

              {stallion.breedingMethods.length > 0 ? (
                <div className="mt-6">
                  <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">
                    {t("detail.breedingMethods")}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {stallion.breedingMethods.map((method) => (
                      <span
                        key={method}
                        className="rounded-full border border-white/10 bg-[#111827] px-4 py-2 text-sm text-gray-200"
                      >
                        {method}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="mt-20">
            <PedigreeSection
              subjectName={pedigreeSection.subjectName}
              tree={pedigreeSection.tree}
              legacy={pedigreeSection.legacy}
            />
          </div>

          {traitResult?.profile ? (
            <div className="mt-16">
              <TraitProfileSection
                profile={traitResult.profile}
                compact
              />

              <p className="mt-3 text-xs text-gray-500">
                {t("detail.traitSummaryNote")}
              </p>
            </div>
          ) : null}

          {traitResult?.canManage && pedigreeHorseId ? (
            <div className="mt-6">
              <Link
                href={`/pedigree/${pedigreeHorseId}/traits`}
                className="inline-flex rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-gray-200 hover:border-blue-500"
              >
                {t("detail.manageTraitEvidence")}
              </Link>
            </div>
          ) : null}

          {stallion.description ? (
            <div className="mt-20">
              <h2 className="text-3xl font-bold mb-6">
                {t("detail.about")}
              </h2>

              <div className="rounded-3xl border border-white/10 bg-[#111827] p-6 sm:p-8 text-gray-300 leading-8 whitespace-pre-wrap">
                {stallion.description}
              </div>
            </div>
          ) : null}

          {stallion.performance ? (
            <div className="mt-16">
              <h2 className="text-3xl font-bold mb-6">
                {t("detail.competitionPerformance")}
              </h2>

              <div className="rounded-3xl border border-white/10 bg-[#111827] p-6 sm:p-8 text-gray-300 leading-8 whitespace-pre-wrap">
                {stallion.performance}
              </div>
            </div>
          ) : null}

          {stallion.breedingHighlights ? (
            <div className="mt-16">
              <h2 className="text-3xl font-bold mb-6">
                {t("detail.breedingHighlights")}
              </h2>

              <div className="rounded-3xl border border-white/10 bg-[#111827] p-6 sm:p-8 text-gray-300 leading-8 whitespace-pre-wrap">
                {stallion.breedingHighlights}
              </div>
            </div>
          ) : null}

          <div className="mt-20">
            <StallionContact stallion={stallion} />
          </div>
        </div>
      </main>
    </>
  );
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl bg-[#111827] border border-white/10 p-4">
      <p className="text-xs uppercase text-gray-500">
        {label}
      </p>

           <p className="text-white font-semibold mt-1">{value}</p>
    </div>
  );
}
