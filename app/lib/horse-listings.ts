import { Horse } from "@/app/data/horses";
import { extractHorseImageStoragePath } from "@/app/lib/horse-image-storage";
import { isDirectPlayableVideoUrl } from "@/app/lib/horse-video-storage";
import { buildListingSlug } from "@/app/lib/marketplace/slug";
import { getPublicListingPath } from "@/app/lib/marketplace/paths";
import {
  CreateHorseListingInput,
  HorseListingImageMeta,
  HorseListingRow,
} from "@/app/types/horse-listing";
import { ListingFormData, ListingImage } from "@/app/types/listing";

const PLACEHOLDER_IMAGE = "/emi.jpg";

export function getListingCoverImageUrl(row: HorseListingRow): string {
  if (row.cover_image_url) return row.cover_image_url;
  if (row.image_urls.length > 0) return row.image_urls[0];
  return PLACEHOLDER_IMAGE;
}

export function getListingDisplayImages(row: HorseListingRow): string[] {
  if (row.image_urls.length === 0) {
    return row.cover_image_url ? [row.cover_image_url] : [PLACEHOLDER_IMAGE];
  }

  if (!row.cover_image_url) {
    return row.image_urls;
  }

  const remaining = row.image_urls.filter((url) => url !== row.cover_image_url);
  return [row.cover_image_url, ...remaining];
}

export function getHorseGalleryImages(images: string[]): string[] {
  const seen = new Set<string>();
  const normalized = images.filter((url) => {
    const trimmed = url?.trim();
    if (!trimmed || seen.has(trimmed)) return false;
    seen.add(trimmed);
    return true;
  });

  return normalized.length > 0 ? normalized : [PLACEHOLDER_IMAGE];
}

export function slugifyListingName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatListingRowPrice(
  row: HorseListingRow,
  priceOnRequestLabel = "Price on request"
): string {
  if (row.price_on_request) return priceOnRequestLabel;
  if (row.price === null) return priceOnRequestLabel;
  return `€${Number(row.price).toLocaleString("en-US")}`;
}

export function listingRowToHorse(
  row: HorseListingRow,
  options?: { priceOnRequestLabel?: string; sellerVerified?: boolean }
): Horse {
  const images = getListingDisplayImages(row);

  return {
    id: listingUuidToDisplayId(row.id),
    listingUuid: row.id,
    slug: row.slug ?? buildListingSlug(row.name, row.id),
    name: row.name,
    breed: row.breed,
    age: row.age,
    height: row.height,
    gender: row.gender,
    color: row.color,
    country: row.country,
    discipline: row.discipline,
    level: row.level,
    price: formatListingRowPrice(row, options?.priceOnRequestLabel),
    verified: row.verified,
    sellerVerified: options?.sellerVerified ?? row.owner_seller_verified ?? false,
    horseVerificationStatus: row.horse_verification_status ?? "unverified",
    horseVerifiedAt: row.horse_verified_at ?? null,
    description: row.description,
    sire: row.sire,
    dam: row.dam,
    damSire: row.dam_sire,
    images,
    sellerName: row.seller_name,
    sellerEmail: row.seller_email,
    sellerPhone: row.seller_phone,
    stableName: row.stable_name ?? undefined,
    videoUrl: row.video_url ?? undefined,
  };
}

export function listingUuidToDisplayId(uuid: string): number {
  let hash = 0;
  for (let i = 0; i < uuid.length; i++) {
    hash = (hash * 31 + uuid.charCodeAt(i)) >>> 0;
  }
  return 900_000_000 + (hash % 99_999_999);
}

export function isListingUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export function getHorseDetailPath(horse: Horse): string {
  if (horse.listingUuid && horse.slug) {
    return getPublicListingPath(horse.slug);
  }
  return horse.listingUuid ? `/horse/${horse.listingUuid}` : `/horse/${horse.id}`;
}

export function buildCreateListingInput(
  formData: ListingFormData,
  images: HorseListingImageMeta[],
  options?: { pendingVideoUpload?: boolean }
): CreateHorseListingInput {
  const imagesMeta: HorseListingImageMeta[] = images;

  return {
    name: formData.name.trim(),
    breed: formData.breed.trim(),
    gender: formData.gender as "Mare" | "Stallion" | "Gelding",
    age: Number(formData.age),
    height: Number(formData.height),
    color: formData.color.trim(),
    country: formData.country.trim(),
    city: formData.city.trim() || null,
    postal_code: formData.postalCode.trim() || null,
    discipline: formData.discipline.trim(),
    level: formData.level.trim(),
    price: formData.priceOnRequest ? null : Number(formData.price),
    price_on_request: formData.priceOnRequest,
    sire: formData.sire.trim(),
    dam: formData.dam.trim(),
    dam_sire: formData.damSire.trim(),
    description: formData.description.trim(),
    image_urls: [],
    cover_image_url: null,
    images_meta: imagesMeta,
    video_url: options?.pendingVideoUpload
      ? null
      : formData.videoUrl.trim() || null,
    video_file_name: null,
    seller_name: formData.sellerName.trim(),
    seller_email: formData.email.trim(),
    seller_phone: formData.phone.trim(),
    stable_name: formData.stableName.trim() || null,
  };
}

export function mergeMarketplaceHorses(
  _demoHorses: Horse[],
  listingHorses: Horse[]
): Horse[] {
  return listingHorses;
}

export { buildListingSlug };

export function listingRowToFormData(row: HorseListingRow): ListingFormData {
  const hasStoredVideo =
    Boolean(row.video_url) && isDirectPlayableVideoUrl(row.video_url ?? "");

  return {
    name: row.name,
    breed: row.breed,
    age: String(row.age),
    gender: row.gender,
    color: row.color,
    height: String(row.height),
    country: row.country,
    city: row.city ?? "",
    postalCode: row.postal_code ?? "",
    discipline: row.discipline,
    level: row.level,
    price:
      row.price_on_request || row.price === null ? "" : String(Number(row.price)),
    priceOnRequest: row.price_on_request,
    sire: row.sire,
    dam: row.dam,
    damSire: row.dam_sire,
    description: row.description,
    videoUrl: hasStoredVideo ? "" : row.video_url ?? "",
    sellerName: row.seller_name,
    email: row.seller_email,
    phone: row.seller_phone,
    stableName: row.stable_name ?? "",
    confirmed: true,
  };
}

export function listingImagesFromRow(row: HorseListingRow): ListingImage[] {
  const orderedUrls = getListingDisplayImages(row);

  return orderedUrls.map((url, index) => {
    const meta =
      row.images_meta.find((item) => item.publicUrl === url) ??
      row.images_meta[index];

    return {
      id: `existing-${index}-${url}`,
      previewUrl: url,
      isCover: row.cover_image_url === url,
      existingUrl: url,
      storagePath:
        meta?.storagePath ?? extractHorseImageStoragePath(url) ?? undefined,
    };
  });
}

export function buildListingFieldUpdates(formData: ListingFormData) {
  return {
    name: formData.name.trim(),
    breed: formData.breed.trim(),
    gender: formData.gender as "Mare" | "Stallion" | "Gelding",
    age: Number(formData.age),
    height: Number(formData.height),
    color: formData.color.trim(),
    country: formData.country.trim(),
    city: formData.city.trim() || null,
    postal_code: formData.postalCode.trim() || null,
    discipline: formData.discipline.trim(),
    level: formData.level.trim(),
    price: formData.priceOnRequest ? null : Number(formData.price),
    price_on_request: formData.priceOnRequest,
    sire: formData.sire.trim(),
    dam: formData.dam.trim(),
    dam_sire: formData.damSire.trim(),
    description: formData.description.trim(),
    seller_name: formData.sellerName.trim(),
    seller_email: formData.email.trim(),
    seller_phone: formData.phone.trim(),
    stable_name: formData.stableName.trim() || null,
  };
}
