import { describe, expect, it } from "vitest";
import { buildHorseListingMetadata } from "@/app/lib/marketplace/seo";
import type { Horse } from "@/app/data/horses";
import type { HorseListingRow } from "@/app/types/horse-listing";
import type { PublicListingProfile } from "@/app/types/marketplace-public";

const ATLAS_DESCRIPTION =
  "Scopey show jumper with a rich training history—ideal for exploring analytics, workload alerts, and exercise frequency charts.";

const horseTemplates = {
  title: "{name} · {discipline} · {level}",
  description:
    "{breed} {gender}, {age} years, {price}. Listed by {breeder} in {country}. {descriptionSnippet}",
  keywords: "{name}, {breed}, {discipline}, {gender}, horse for sale, {country}",
  openGraphTitle: "{name} — {breed} {gender} for sale | {siteName}",
  openGraphDescription: "{breed} {gender}, {age} years old, {price}. {descriptionSnippet}",
  twitterTitle: "{name} | {siteName}",
  twitterDescription: "{breed} {gender} for sale — {price}. {descriptionSnippet}",
};

function atlasProfile(): PublicListingProfile {
  const listing = {
    id: "atlas-listing",
    user_id: "seller-1",
    name: "Atlas",
    breed: "KWPN",
    gender: "Gelding",
    age: 9,
    height: 168,
    color: "Bay",
    country: "Germany",
    discipline: "Show Jumping",
    level: "International / Grand Prix",
    price: null,
    price_on_request: true,
    sire: "Sire",
    dam: "Dam",
    dam_sire: "Dam sire",
    description: ATLAS_DESCRIPTION,
    image_urls: ["https://example.com/atlas.jpg"],
    cover_image_url: "https://example.com/atlas.jpg",
    images_meta: [],
    video_url: null,
    video_file_name: null,
    seller_name: "Demo Seller",
    seller_email: "seller@example.com",
    seller_phone: "",
    stable_name: "EquiMaster Demo Stable",
    verified: false,
    horse_verification_status: "unverified",
    horse_verified_at: null,
    horse_verified_by: null,
    owner_seller_verified: false,
    status: "active",
    pedigree_horse_id: null,
    slug: "atlas-1b8dd4f0",
    published_at: "2026-01-01T00:00:00.000Z",
    view_count: 0,
    public_training_summary: null,
    public_health_summary: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  } satisfies HorseListingRow;

  const horse = {
    id: 1,
    slug: listing.slug,
    listingUuid: listing.id,
    name: listing.name,
    breed: listing.breed,
    age: listing.age,
    height: listing.height,
    gender: listing.gender,
    color: listing.color,
    country: listing.country,
    discipline: listing.discipline,
    level: listing.level,
    price: "Price on request",
    verified: false,
    description: ATLAS_DESCRIPTION,
    sire: listing.sire,
    dam: listing.dam,
    damSire: listing.dam_sire,
    images: listing.image_urls,
    sellerName: listing.seller_name,
    stableName: listing.stable_name ?? undefined,
  } satisfies Horse;

  return {
    listing,
    horse,
    pedigreeHorse: null,
    trainingSummary: null,
    healthSummary: null,
    publicUrl: `/horses/${listing.slug}`,
  };
}

describe("buildHorseListingMetadata meta description", () => {
  it("keeps the Atlas production case at or under 160 characters without breaking core facts", () => {
    const metadata = buildHorseListingMetadata(atlasProfile(), "en", {
      siteName: "Shabdiz",
      imageAltTemplate: "{name} — {discipline} sport horse for sale",
      templates: horseTemplates,
      priceOnRequestLabel: "Price on request",
      genderLabels: {
        Mare: "Mare",
        Stallion: "Stallion",
        Gelding: "Gelding",
        unknown: "Unknown",
      },
    });

    const description = metadata.description ?? "";

    expect(description).toBe(
      "KWPN Gelding, 9 years, Price on request. Listed by EquiMaster Demo Stable in Germany. Scopey show jumper with a rich training history—ideal for exploring"
    );
    expect(description.length).toBe(153);
    expect(description.length).toBeLessThanOrEqual(160);
    expect(description.startsWith("KWPN Gelding, 9 years, Price on request.")).toBe(true);
    expect(description).toContain("Listed by EquiMaster Demo Stable in Germany.");
    expect(description).not.toMatch(/Shabdiz/);
    expect(description).not.toMatch(/\{[a-zA-Z]+\}/);
    expect(description).not.toMatch(/\banalyt$/);
    expect(description.endsWith(" ")).toBe(false);
  });
});
