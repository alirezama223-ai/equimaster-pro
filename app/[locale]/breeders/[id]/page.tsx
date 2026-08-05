import { Link } from "@/i18n/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Navbar from "@/app/components/navbar/Navbar";
import VerifiedBadge from "@/app/components/admin/VerifiedBadge";
import StallionCard from "@/app/components/stallions/StallionCard";
import HorseCard from "@/app/components/featured/HorseCard";
import { isBreederUuid } from "@/app/lib/breeders";
import { getCachedBreederById } from "@/app/lib/entity-profile-cache";
import { listingRowToHorse } from "@/app/lib/horse-listings";
import {
  buildBreederMetadata,
  buildBreederOrganizationJsonLd,
  loadEntitySeoTemplates,
} from "@/app/lib/seo/entity-metadata";
import { type AppLocale, routing } from "@/i18n/routing";
import { HorseListingRow } from "@/app/types/horse-listing";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string; locale: string }>;
};

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

  if (!isBreederUuid(id)) {
    notFound();
  }

  const result = await getCachedBreederById(id);

  if (!result.breeder) {
    notFound();
  }

  const { breeder, stallions, listings } = result;
  const listingHorses = (listings ?? []).map((row) =>
    listingRowToHorse(row as HorseListingRow)
  );

  const hasEmail = Boolean(breeder.email?.trim());
  const hasPhone = Boolean(breeder.phone?.trim());
  const hasWebsite = Boolean(breeder.website?.trim());
  const organizationJsonLd = buildBreederOrganizationJsonLd(breeder);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <Navbar />

      <main className="min-h-screen bg-[#081223] text-white pt-20 pb-24">
        <div className="relative h-56 sm:h-72 overflow-hidden">
          <Image
            src={breeder.coverImageUrl}
            alt={t("detail.coverAlt", { name: breeder.name })}
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#081223] via-black/40 to-black/20" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-16 relative">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-3xl border-4 border-[#081223] bg-[#111827]">
              <Image
                src={breeder.logoUrl}
                alt={t("detail.logoAlt", { name: breeder.name })}
                fill
                className="object-cover"
              />
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3">
                {breeder.verified ? <VerifiedBadge /> : null}
              </div>
              <h1 className="text-4xl sm:text-5xl font-black mt-2">{breeder.name}</h1>
              <p className="mt-2 text-gray-400 text-lg">
                📍 {breeder.city ? `${breeder.city}, ` : ""}
                {breeder.country}
              </p>

              {breeder.disciplines.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {breeder.disciplines.map((discipline) => (
                    <span
                      key={discipline}
                      className="rounded-full border border-white/10 bg-[#111827] px-4 py-2 text-sm"
                    >
                      {discipline}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {breeder.description ? (
            <section className="mt-12">
              <h2 className="text-3xl font-bold mb-6">{t("detail.about")}</h2>
              <div className="rounded-3xl border border-white/10 bg-[#111827] p-6 sm:p-8 text-gray-300 leading-8 whitespace-pre-wrap">
                {breeder.description}
              </div>
            </section>
          ) : null}

          <section className="mt-16">
            <h2 className="text-3xl font-bold mb-8">{t("detail.stallions")}</h2>
            {stallions.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-[#111827] px-8 py-12 text-center text-gray-400">
                {t("detail.noStallions")}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                {stallions.map((stallion) => (
                  <StallionCard key={stallion.id} stallion={stallion} />
                ))}
              </div>
            )}
          </section>

          {listingHorses.length > 0 ? (
            <section className="mt-16">
              <h2 className="text-3xl font-bold mb-8">{t("detail.horsesForSale")}</h2>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                {listingHorses.map((horse) => (
                  <HorseCard key={horse.listingUuid ?? horse.id} horse={horse} />
                ))}
              </div>
            </section>
          ) : null}

          <section className="mt-16 rounded-3xl border border-white/10 bg-[#111827] p-6 sm:p-8">
            <h2 className="text-2xl font-bold">{t("detail.contact")}</h2>
            <p className="mt-3 text-gray-400">
              {t("detail.contactDescription", { name: breeder.name })}
            </p>

            <div className="mt-6 flex flex-col sm:flex-row flex-wrap gap-4">
              {hasEmail ? (
                <a
                  href={`mailto:${breeder.email}`}
                  className="inline-flex justify-center rounded-xl bg-blue-600 hover:bg-blue-500 px-6 py-4 text-white font-semibold transition"
                >
                  {breeder.email}
                </a>
              ) : null}

              {hasPhone ? (
                <a
                  href={`tel:${breeder.phone}`}
                  className="inline-flex justify-center rounded-xl border border-white/15 px-6 py-4 text-white font-semibold hover:border-blue-500 transition"
                >
                  {breeder.phone}
                </a>
              ) : null}

              {hasWebsite ? (
                <a
                  href={
                    breeder.website!.startsWith("http")
                      ? breeder.website!
                      : `https://${breeder.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex justify-center rounded-xl border border-white/15 px-6 py-4 text-white font-semibold hover:border-blue-500 transition"
                >
                  {t("detail.website")}
                </a>
              ) : null}

              {!hasEmail && !hasPhone && !hasWebsite ? (
                <p className="text-gray-500">{t("detail.noContactDetails")}</p>
              ) : null}
            </div>
          </section>

          <div className="mt-8">
            <Link href="/breeders" className="text-gray-400 hover:text-white transition">
              {t("detail.backToDirectory")}
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
