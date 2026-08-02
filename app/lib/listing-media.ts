import { isAcceptedImageType } from "@/app/lib/listing-validation";
import {
  ListingImage,
  MAX_LISTING_IMAGES,
  MAX_LISTING_IMAGE_BYTES,
} from "@/app/types/listing";

export type ImageSelectionResult =
  | { ok: true; images: ListingImage[] }
  | { ok: false; error: string };

function createListingImage(file: File, isCover: boolean): ListingImage {
  return {
    id: `${file.name}-${file.lastModified}-${crypto.randomUUID()}`,
    file,
    previewUrl: URL.createObjectURL(file),
    isCover,
  };
}

export function addListingImages(
  currentImages: ListingImage[],
  files: FileList | File[]
): ImageSelectionResult {
  const selected = Array.from(files);

  if (selected.length === 0) {
    return { ok: true, images: currentImages };
  }

  const invalidType = selected.find((file) => !isAcceptedImageType(file));
  if (invalidType) {
    return {
      ok: false,
      error: "Only JPG, PNG, WEBP, and GIF images are allowed.",
    };
  }

  const oversized = selected.find((file) => file.size > MAX_LISTING_IMAGE_BYTES);
  if (oversized) {
    return {
      ok: false,
      error: "Each image must be 10 MB or smaller.",
    };
  }

  if (currentImages.length + selected.length > MAX_LISTING_IMAGES) {
    return {
      ok: false,
      error: `You can upload up to ${MAX_LISTING_IMAGES} images.`,
    };
  }

  const hasCover = currentImages.some((image) => image.isCover);
  const nextImages = selected.map((file, index) =>
    createListingImage(file, !hasCover && index === 0 && currentImages.length === 0)
  );

  if (!hasCover && currentImages.length > 0 && nextImages.length > 0) {
    nextImages[0] = { ...nextImages[0], isCover: true };
  }

  return {
    ok: true,
    images: [...currentImages, ...nextImages],
  };
}

export function removeListingImage(
  images: ListingImage[],
  id: string
): ListingImage[] {
  const removed = images.find((image) => image.id === id);
  if (removed?.previewUrl.startsWith("blob:")) {
    URL.revokeObjectURL(removed.previewUrl);
  }

  const remaining = images.filter((image) => image.id !== id);
  if (remaining.length === 0) return remaining;

  if (!remaining.some((image) => image.isCover)) {
    return remaining.map((image, index) => ({
      ...image,
      isCover: index === 0,
    }));
  }

  return remaining;
}

export function setCoverImage(
  images: ListingImage[],
  id: string
): ListingImage[] {
  return images.map((image) => ({
    ...image,
    isCover: image.id === id,
  }));
}

export function revokeListingImages(images: ListingImage[]) {
  images.forEach((image) => {
    if (image.previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(image.previewUrl);
    }
  });
}
