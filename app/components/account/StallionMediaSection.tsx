"use client";

import Image from "next/image";
import FormField from "@/app/components/sell/FormField";
import FormSection from "@/app/components/sell/FormSection";
import {
  addListingImages,
  removeListingImage,
  setCoverImage,
} from "@/app/lib/listing-media";
import { MAX_STALLION_IMAGES } from "@/app/lib/stallion-image-storage";
import { ListingImage } from "@/app/types/listing";

type Props = {
  images: ListingImage[];
  mediaError: string | null;
  onImagesChange: (images: ListingImage[]) => void;
  onMediaError: (message: string | null) => void;
};

export default function StallionMediaSection({
  images,
  mediaError,
  onImagesChange,
  onMediaError,
}: Props) {
  function handleImageSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files) return;

    const result = addListingImages(images, files);
    if (!result.ok) {
      onMediaError(result.error);
      event.target.value = "";
      return;
    }

    if (result.images.length > MAX_STALLION_IMAGES) {
      onMediaError(`You can upload up to ${MAX_STALLION_IMAGES} images.`);
      event.target.value = "";
      return;
    }

    onMediaError(null);
    onImagesChange(result.images.slice(0, MAX_STALLION_IMAGES));
    event.target.value = "";
  }

  return (
    <FormSection
      title="Stallion Photos"
      subtitle="Upload multiple photos and choose one cover image for the directory and profile."
    >
      <FormField
        label={`Photos (${images.length}/${MAX_STALLION_IMAGES})`}
        error={mediaError ?? undefined}
        required
      >
        <label className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-blue-500/40 bg-[#08111F] px-6 py-10 text-center cursor-pointer hover:border-blue-500 transition">
          <span className="text-3xl">📸</span>
          <span className="text-white font-semibold">Select stallion photos</span>
          <span className="text-sm text-gray-400">
            JPG, PNG, WEBP, or GIF up to 10 MB each. Choose a cover after upload.
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleImageSelection}
            className="hidden"
          />
        </label>
      </FormField>

      {images.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className={`relative overflow-hidden rounded-2xl border ${
                image.isCover ? "border-blue-500 ring-2 ring-blue-500/40" : "border-white/10"
              }`}
            >
              <Image
                src={image.previewUrl}
                alt="Stallion photo"
                width={400}
                height={300}
                unoptimized={image.previewUrl.startsWith("blob:")}
                className="h-40 w-full object-cover"
              />

              <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-2 bg-black/70 p-3">
                {!image.isCover ? (
                  <button
                    type="button"
                    onClick={() => onImagesChange(setCoverImage(images, image.id))}
                    className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white"
                  >
                    Set Cover
                  </button>
                ) : (
                  <span className="rounded-lg bg-blue-600/90 px-3 py-1 text-xs font-semibold text-white">
                    Cover Image
                  </span>
                )}

                <button
                  type="button"
                  onClick={() => onImagesChange(removeListingImage(images, image.id))}
                  className="rounded-lg border border-white/20 px-3 py-1 text-xs font-semibold text-white"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </FormSection>
  );
}
