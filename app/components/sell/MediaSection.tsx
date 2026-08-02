"use client";



import Image from "next/image";

import { useTranslations } from "next-intl";

import FormField, { sellInputClassName } from "@/app/components/sell/FormField";

import FormSection from "@/app/components/sell/FormSection";

import {

  addListingImages,

  removeListingImage,

  setCoverImage,

} from "@/app/lib/listing-media";

import { ListingFormErrors } from "@/app/lib/listing-validation";

import { validateListingVideoFile } from "@/app/lib/horse-video-storage";

import { ListingFormData, ListingImage, MAX_LISTING_IMAGES } from "@/app/types/listing";



type Props = {

  data: ListingFormData;

  errors: ListingFormErrors;

  images: ListingImage[];

  videoFile: File | null;

  videoPreviewUrl: string | null;

  existingVideoUrl?: string | null;

  existingVideoFileName?: string | null;

  mediaError: string | null;

  onChange: <K extends keyof ListingFormData>(

    field: K,

    value: ListingFormData[K]

  ) => void;

  onImagesChange: (images: ListingImage[]) => void;

  onVideoFileChange: (file: File | null, previewUrl: string | null) => void;

  onRemoveExistingVideo?: () => void;

  onMediaError: (message: string | null) => void;

};



export default function MediaSection({

  data,

  errors,

  images,

  videoFile,

  videoPreviewUrl,

  existingVideoUrl,

  existingVideoFileName,

  mediaError,

  onChange,

  onImagesChange,

  onVideoFileChange,

  onRemoveExistingVideo,

  onMediaError,

}: Props) {

  const t = useTranslations("sell");



  function handleImageSelection(event: React.ChangeEvent<HTMLInputElement>) {

    const files = event.target.files;

    if (!files) return;



    const result = addListingImages(images, files);

    if (!result.ok) {

      onMediaError(result.error);

      event.target.value = "";

      return;

    }



    onMediaError(null);

    onImagesChange(result.images);

    event.target.value = "";

  }



  function handleRemoveImage(id: string) {

    onImagesChange(removeListingImage(images, id));

  }



  function handleSetCover(id: string) {

    onImagesChange(setCoverImage(images, id));

  }



  function handleVideoSelection(event: React.ChangeEvent<HTMLInputElement>) {

    const file = event.target.files?.[0];

    if (!file) return;



    const validationError = validateListingVideoFile(file);

    if (validationError) {

      onMediaError(validationError);

      event.target.value = "";

      return;

    }



    onMediaError(null);

    onChange("videoUrl", "");

    onVideoFileChange(file, URL.createObjectURL(file));

    event.target.value = "";

  }



  function handleRemoveVideo() {

    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);

    onVideoFileChange(null, null);

  }



  return (

    <FormSection title={t("media.title")} subtitle={t("media.subtitle")}>

      <div className="space-y-8">

        <div>

          <FormField

            label={t("media.photosLabel", { current: images.length, max: MAX_LISTING_IMAGES })}

            error={errors.images || mediaError || undefined}

            required

          >

            <label className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-blue-500/40 bg-[#08111F] px-6 py-10 text-center cursor-pointer hover:border-blue-500 transition">

              <span className="text-3xl">📸</span>

              <span className="text-white font-semibold">{t("media.selectPhotos")}</span>

              <span className="text-sm text-gray-400">{t("media.photosHint")}</span>

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

                    image.isCover ? "border-blue-500" : "border-white/10"

                  }`}

                >

                  <Image

                    src={image.previewUrl}

                    alt={t("media.selectedPhotoAlt")}

                    width={400}

                    height={300}

                    unoptimized={image.previewUrl.startsWith("blob:")}

                    className="h-40 w-full object-cover"

                  />



                  <div className="absolute inset-x-0 bottom-0 flex flex-wrap gap-2 bg-black/70 p-3">

                    {!image.isCover ? (

                      <button

                        type="button"

                        onClick={() => handleSetCover(image.id)}

                        className="rounded-lg bg-blue-600 px-3 py-1 text-xs font-semibold text-white"

                      >

                        {t("media.setCover")}

                      </button>

                    ) : (

                      <span className="rounded-lg bg-blue-600/90 px-3 py-1 text-xs font-semibold text-white">

                        {t("media.coverImage")}

                      </span>

                    )}



                    <button

                      type="button"

                      onClick={() => handleRemoveImage(image.id)}

                      className="rounded-lg border border-white/20 px-3 py-1 text-xs font-semibold text-white"

                    >

                      {t("media.remove")}

                    </button>

                  </div>

                </div>

              ))}

            </div>

          ) : null}

        </div>



        <div className="grid gap-5 lg:grid-cols-2">

          <FormField label={t("media.videoFile")} error={errors.video}>

            <label className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-gray-700 bg-[#08111F] px-6 py-8 text-center cursor-pointer hover:border-blue-500 transition">

              <span className="text-2xl">🎥</span>

              <span className="text-white font-medium">

                {videoFile ? videoFile.name : t("media.selectVideo")}

              </span>

              <span className="text-sm text-gray-400">{t("media.videoHint")}</span>

              <input

                type="file"

                accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"

                onChange={handleVideoSelection}

                className="hidden"

              />

            </label>



            {videoPreviewUrl ? (

              <div className="mt-4 space-y-3">

                <video

                  src={videoPreviewUrl}

                  controls

                  className="w-full rounded-2xl border border-white/10"

                />

                <button

                  type="button"

                  onClick={handleRemoveVideo}

                  className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10 transition"

                >

                  {t("media.removeVideo")}

                </button>

              </div>

            ) : existingVideoUrl ? (

              <div className="mt-4 space-y-3">

                <video

                  src={existingVideoUrl}

                  controls

                  className="w-full rounded-2xl border border-white/10"

                />

                <p className="text-sm text-gray-400">

                  {t("media.currentVideo")}

                  {existingVideoFileName ? `: ${existingVideoFileName}` : ""}

                </p>

                {onRemoveExistingVideo ? (

                  <button

                    type="button"

                    onClick={onRemoveExistingVideo}

                    className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white hover:bg-white/10 transition"

                  >

                    {t("media.removeCurrentVideo")}

                  </button>

                ) : null}

              </div>

            ) : null}

          </FormField>



          <FormField label={t("media.videoUrl")} htmlFor="videoUrl" error={errors.video}>

            <input

              id="videoUrl"

              type="url"

              value={data.videoUrl}

              disabled={Boolean(videoFile) || Boolean(existingVideoUrl)}

              onChange={(e) => onChange("videoUrl", e.target.value)}

              className={`${sellInputClassName} disabled:opacity-50`}

              placeholder={t("media.videoUrlPlaceholder")}

            />

            <p className="mt-2 text-sm text-gray-500">{t("media.videoUrlHint")}</p>

          </FormField>

        </div>

      </div>

    </FormSection>

  );

}


