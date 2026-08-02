import {
  ACCEPTED_IMAGE_TYPES,
  DESCRIPTION_MAX_LENGTH,
  ListingFormData,
  ListingImage,
  MAX_LISTING_IMAGES,
  MAX_LISTING_IMAGE_BYTES,
} from "@/app/types/listing";
import { isValidBreedName } from "@/app/lib/breeds";
import { isValidCountryName } from "@/app/lib/constants/countries";
import { isValidDiscipline } from "@/app/lib/constants/disciplines";
import { validateListingVideoFile } from "@/app/lib/horse-video-storage";

export type ListingFormErrors = Partial<Record<keyof ListingFormData | "images" | "video", string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateListingForm(
  data: ListingFormData,
  images: ListingImage[],
  videoFile: File | null
): ListingFormErrors {
  const errors: ListingFormErrors = {};

  if (!data.name.trim()) errors.name = "Horse name is required.";
  if (!data.breed.trim()) {
    errors.breed = "Breed is required.";
  } else if (!isValidBreedName(data.breed)) {
    errors.breed = "Select a breed from the list.";
  }
  if (!data.age.trim()) {
    errors.age = "Age is required.";
  } else if (!Number.isFinite(Number(data.age)) || Number(data.age) < 0) {
    errors.age = "Enter a valid age in years.";
  }
  if (!data.gender) errors.gender = "Select a gender.";
  if (!data.color.trim()) errors.color = "Color is required.";
  if (!data.height.trim()) {
    errors.height = "Height is required.";
  } else if (!Number.isFinite(Number(data.height)) || Number(data.height) <= 0) {
    errors.height = "Enter a valid height in cm.";
  }
  if (!data.country.trim()) {
    errors.country = "Country is required.";
  } else if (!isValidCountryName(data.country)) {
    errors.country = "Select a country from the list.";
  }
  if (!data.discipline.trim()) {
    errors.discipline = "Discipline is required.";
  } else if (!isValidDiscipline(data.discipline)) {
    errors.discipline = "Select a discipline from the list.";
  }
  if (!data.level.trim()) errors.level = "Competition level is required.";

  if (!data.priceOnRequest) {
    if (!data.price.trim()) {
      errors.price = "Price is required, or select Price on request.";
    } else if (!Number.isFinite(Number(data.price)) || Number(data.price) <= 0) {
      errors.price = "Enter a valid price in EUR.";
    }
  }

  if (!data.sire.trim()) errors.sire = "Sire is required.";
  if (!data.dam.trim()) errors.dam = "Dam is required.";
  if (!data.damSire.trim()) errors.damSire = "Dam sire is required.";

  if (!data.description.trim()) {
    errors.description = "Description is required.";
  } else if (data.description.length > DESCRIPTION_MAX_LENGTH) {
    errors.description = `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer.`;
  }

  if (images.length === 0) {
    errors.images = "Add at least one horse photo.";
  } else if (images.length > MAX_LISTING_IMAGES) {
    errors.images = `Maximum ${MAX_LISTING_IMAGES} images allowed.`;
  } else if (!images.every((image) => image.file || image.existingUrl)) {
    errors.images = "One or more selected images are invalid.";
  } else if (!images.some((image) => image.isCover)) {
    errors.images = "Select a cover image.";
  } else {
    const oversized = images.find(
      (image) => image.file && image.file.size > MAX_LISTING_IMAGE_BYTES
    );
    if (oversized) {
      errors.images = "Each image must be 10 MB or smaller.";
    }
  }

  if (videoFile) {
    const videoError = validateListingVideoFile(videoFile);
    if (videoError) {
      errors.video = videoError;
    }
  } else if (data.videoUrl.trim()) {
    try {
      new URL(data.videoUrl.trim());
    } catch {
      errors.video = "Enter a valid video URL.";
    }
  }

  if (!data.sellerName.trim()) errors.sellerName = "Seller name is required.";
  if (!data.email.trim()) {
    errors.email = "Email is required.";
  } else if (!emailPattern.test(data.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (!data.phone.trim()) errors.phone = "Phone number is required.";
  if (!data.confirmed) {
    errors.confirmed = "You must confirm the information is accurate.";
  }

  return errors;
}

export function isAcceptedImageType(file: File): boolean {
  return ACCEPTED_IMAGE_TYPES.includes(
    file.type as (typeof ACCEPTED_IMAGE_TYPES)[number]
  );
}

export function formatListingPrice(data: ListingFormData): string {
  if (data.priceOnRequest) return "Price on request";
  const value = Number(data.price);
  if (!Number.isFinite(value)) return data.price;
  return `€${value.toLocaleString("en-US")}`;
}
