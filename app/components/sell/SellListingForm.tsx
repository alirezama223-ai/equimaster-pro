"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BasicInfoSection from "@/app/components/sell/BasicInfoSection";
import DescriptionSection from "@/app/components/sell/DescriptionSection";
import ListingEditSuccess from "@/app/components/sell/ListingEditSuccess";
import ListingPreview from "@/app/components/sell/ListingPreview";
import ListingSuccess from "@/app/components/sell/ListingSuccess";
import MediaSection from "@/app/components/sell/MediaSection";
import PedigreeSection from "@/app/components/sell/PedigreeSection";
import PriceSection from "@/app/components/sell/PriceSection";
import SellerInfoSection from "@/app/components/sell/SellerInfoSection";
import SportInfoSection from "@/app/components/sell/SportInfoSection";
import VerificationSection from "@/app/components/sell/VerificationSection";
import {
  createHorseListing,
  rollbackHorseListing,
  updateHorseListing,
  updateHorseListingVideo,
} from "@/app/actions/horse-listings";
import {
  listingImagesFromRow,
  listingRowToFormData,
} from "@/app/lib/horse-listings";
import { revokeListingImages } from "@/app/lib/listing-media";
import { createClient } from "@/app/lib/supabase/client";
import {
  extractHorseVideoStoragePath,
  isDirectPlayableVideoUrl,
  removeListingVideoFromStorage,
  uploadListingVideoToStorage,
} from "@/app/lib/horse-video-storage";
import {
  ListingFormErrors,
  validateListingForm,
} from "@/app/lib/listing-validation";
import { HorseListingRow } from "@/app/types/horse-listing";
import {
  initialListingFormData,
  ListingFormData,
  ListingImage,
} from "@/app/types/listing";

type Props = {
  mode?: "create" | "edit";
  initialListing?: HorseListingRow;
};

type Step = "form" | "preview" | "success";

type ExistingVideoState = {
  url: string;
  fileName: string | null;
  storagePath: string | null;
};

function formatDevActionError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function buildExistingVideoState(listing: HorseListingRow): ExistingVideoState | null {
  if (!listing.video_url || !isDirectPlayableVideoUrl(listing.video_url)) {
    return null;
  }

  return {
    url: listing.video_url,
    fileName: listing.video_file_name,
    storagePath: extractHorseVideoStoragePath(listing.video_url),
  };
}

export default function SellListingForm({
  mode = "create",
  initialListing,
}: Props) {
  const isEditMode = mode === "edit" && Boolean(initialListing);
  const router = useRouter();
  const listingId = initialListing?.id ?? null;

  const initialExistingImagesRef = useRef<ListingImage[]>(
    initialListing ? listingImagesFromRow(initialListing) : []
  );

  const [step, setStep] = useState<Step>("form");
  const [formData, setFormData] = useState<ListingFormData>(() =>
    initialListing ? listingRowToFormData(initialListing) : initialListingFormData
  );
  const [images, setImages] = useState<ListingImage[]>(() =>
    initialListing ? listingImagesFromRow(initialListing) : []
  );
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [existingVideo, setExistingVideo] = useState<ExistingVideoState | null>(() =>
    initialListing ? buildExistingVideoState(initialListing) : null
  );
  const [removeExistingVideo, setRemoveExistingVideo] = useState(false);
  const [errors, setErrors] = useState<ListingFormErrors>({});
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedListingId, setSavedListingId] = useState<string | null>(listingId);

  function updateField<K extends keyof ListingFormData>(
    field: K,
    value: ListingFormData[K]
  ) {
    setFormData((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleVideoFileChange(file: File | null, previewUrl: string | null) {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoFile(file);
    setVideoPreviewUrl(previewUrl);
    if (file) {
      setRemoveExistingVideo(false);
    }
    setErrors((current) => ({ ...current, video: undefined }));
  }

  function handleRemoveExistingVideo() {
    setRemoveExistingVideo(true);
    setExistingVideo(null);
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoFile(null);
    setVideoPreviewUrl(null);
    updateField("videoUrl", "");
    setMediaError(null);
  }

  function handleValidate(): ListingFormErrors {
    const nextErrors = validateListingForm(formData, images, videoFile);
    setErrors(nextErrors);
    return nextErrors;
  }

  function handlePreview() {
    const nextErrors = handleValidate();
    if (Object.keys(nextErrors).length > 0) return;
    setSubmitError(null);
    setStep("preview");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function getRemovedImagePaths() {
    const currentExistingUrls = new Set(
      images
        .map((image) => image.existingUrl)
        .filter((url): url is string => Boolean(url))
    );

    return initialExistingImagesRef.current
      .filter(
        (image) => image.existingUrl && !currentExistingUrls.has(image.existingUrl)
      )
      .map((image) => image.storagePath)
      .filter((path): path is string => Boolean(path));
  }

  async function handleCreateSubmit() {
    const submission = new FormData();
    submission.append(
      "payload",
      JSON.stringify({
        formData,
        images: images.map((image) => ({
          isCover: image.isCover,
          name: image.file!.name,
          size: image.file!.size,
          type: image.file!.type,
        })),
        hasVideoFile: Boolean(videoFile),
      })
    );

    images.forEach((image, index) => {
      submission.append(`image_${index}`, image.file!);
    });

    const result = await createHorseListing(submission);

    if (result.error) {
      setSubmitError(result.error);
      return;
    }

    const newListingId = result.data?.id;

    if (!newListingId) {
      setSubmitError("Listing was saved but could not be confirmed. Please check My Listings.");
      return;
    }

    if (videoFile) {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        await rollbackHorseListing(newListingId);
        setSubmitError(
          "Your session expired before the video could upload. Please sign in and try again."
        );
        return;
      }

      const videoUpload = await uploadListingVideoToStorage(
        supabase,
        user.id,
        newListingId,
        videoFile
      );

      if (videoUpload.error || !videoUpload.data) {
        await rollbackHorseListing(newListingId);
        setSubmitError(
          videoUpload.error ?? "Your listing was not saved because video upload failed."
        );
        return;
      }

      const videoUpdate = await updateHorseListingVideo(newListingId, {
        video_url: videoUpload.data.publicUrl,
        video_file_name: videoUpload.data.fileName,
      });

      if (videoUpdate.error) {
        await removeListingVideoFromStorage(supabase, videoUpload.data.storagePath);
        await rollbackHorseListing(newListingId);
        setSubmitError(videoUpdate.error);
        return;
      }
    }

    setSavedListingId(newListingId);
    setStep("success");
    router.refresh();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleEditSubmit() {
    if (!listingId) {
      setSubmitError("Listing could not be identified.");
      return;
    }

    let newVideoStoragePath: string | null = null;
    let deleteVideoPath: string | null = null;

    let videoPayload:
      | { action: "keep" }
      | { action: "remove" }
      | { action: "external"; video_url: string }
      | { action: "storage"; video_url: string; video_file_name: string };

    const originalExistingVideo = initialListing
      ? buildExistingVideoState(initialListing)
      : null;

    if (videoFile) {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setSubmitError("Your session expired. Please sign in and try again.");
        return;
      }

      const videoUpload = await uploadListingVideoToStorage(
        supabase,
        user.id,
        listingId,
        videoFile
      );

      if (videoUpload.error || !videoUpload.data) {
        setSubmitError(videoUpload.error ?? "Video upload failed. Your listing was not changed.");
        return;
      }

      newVideoStoragePath = videoUpload.data.storagePath;
      videoPayload = {
        action: "storage",
        video_url: videoUpload.data.publicUrl,
        video_file_name: videoUpload.data.fileName,
      };

      if (originalExistingVideo?.storagePath) {
        deleteVideoPath = originalExistingVideo.storagePath;
      }
    } else if (removeExistingVideo) {
      videoPayload = { action: "remove" };
      deleteVideoPath = originalExistingVideo?.storagePath ?? null;
    } else if (originalExistingVideo && !removeExistingVideo) {
      videoPayload = { action: "keep" };
    } else if (formData.videoUrl.trim()) {
      videoPayload = { action: "external", video_url: formData.videoUrl.trim() };
      if (originalExistingVideo?.storagePath) {
        deleteVideoPath = originalExistingVideo.storagePath;
      }
    } else {
      videoPayload = { action: "remove" };
      if (originalExistingVideo?.storagePath) {
        deleteVideoPath = originalExistingVideo.storagePath;
      }
    }

    let newFileIndex = 0;
    const imagePayload = images.map((image) => {
      if (image.file) {
        const index = newFileIndex;
        newFileIndex += 1;
        return {
          isCover: image.isCover,
          isNew: true,
          newFileIndex: index,
          name: image.file.name,
          size: image.file.size,
          type: image.file.type,
        };
      }

      return {
        isCover: image.isCover,
        isNew: false,
        existingUrl: image.existingUrl,
        storagePath: image.storagePath,
        name: image.existingUrl?.split("/").pop() ?? "existing-image.jpg",
        size: 0,
        type: "image/jpeg",
      };
    });

    const submission = new FormData();
    submission.append(
      "payload",
      JSON.stringify({
        listingId,
        formData,
        images: imagePayload,
        removedImagePaths: getRemovedImagePaths(),
        video: videoPayload,
        deleteVideoPath,
      })
    );

    let uploadIndex = 0;
    images.forEach((image) => {
      if (image.file) {
        submission.append(`image_new_${uploadIndex}`, image.file);
        uploadIndex += 1;
      }
    });

    const result = await updateHorseListing(submission);

    if (result.error) {
      if (newVideoStoragePath) {
        const supabase = createClient();
        await removeListingVideoFromStorage(supabase, newVideoStoragePath);
      }
      setSubmitError(result.error);
      return;
    }

    setSavedListingId(listingId);
    setStep("success");
    router.refresh();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit() {
    const nextErrors = handleValidate();
    if (Object.keys(nextErrors).length > 0) {
      setStep("form");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      if (isEditMode) {
        await handleEditSubmit();
      } else {
        await handleCreateSubmit();
      }
    } catch (error) {
      const message =
        process.env.NODE_ENV === "development"
          ? formatDevActionError(error)
          : isEditMode
            ? "Unable to update your listing right now. Please try again."
            : "Unable to save your listing right now. Please try again.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleResetForm() {
    if (!isEditMode) {
      revokeListingImages(images);
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
      setFormData(initialListingFormData);
      setImages([]);
      setVideoFile(null);
      setVideoPreviewUrl(null);
      setExistingVideo(null);
      setRemoveExistingVideo(false);
      setErrors({});
      setMediaError(null);
      setSubmitError(null);
      setSavedListingId(null);
      setStep("form");
    }
  }

  if (step === "success") {
    if (isEditMode && savedListingId) {
      return <ListingEditSuccess data={formData} listingId={savedListingId} />;
    }

    return <ListingSuccess data={formData} listingId={savedListingId ?? undefined} />;
  }

  if (step === "preview") {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <p className="uppercase tracking-[6px] text-blue-500 text-sm font-semibold">
            {isEditMode ? "Review Changes" : "Review Listing"}
          </p>
          <h2 className="text-4xl font-black text-white mt-3">
            {isEditMode ? "Preview before saving" : "Preview before submission"}
          </h2>
          <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
            {isEditMode
              ? "Confirm your updates before saving this listing."
              : "This preview shows how your listing will approximately appear to buyers."}
          </p>
        </div>

        <ListingPreview
          data={formData}
          images={images}
          videoFile={videoFile}
          videoPreviewUrl={videoPreviewUrl}
          existingVideoUrl={
            !videoFile && !videoPreviewUrl && existingVideo && !removeExistingVideo
              ? existingVideo.url
              : null
          }
        />

        {submitError ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 text-center">
            {submitError}
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            type="button"
            onClick={() => setStep("form")}
            disabled={isSubmitting}
            className="px-8 py-4 rounded-xl border border-white/20 text-white hover:bg-white/10 font-semibold transition disabled:opacity-60"
          >
            Back to Edit
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition"
          >
            {isSubmitting
              ? isEditMode
                ? "Saving Changes..."
                : "Saving Listing..."
              : isEditMode
                ? "Save Changes"
                : "Submit Listing"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="space-y-8"
      onSubmit={(event) => {
        event.preventDefault();
        handlePreview();
      }}
    >
      <BasicInfoSection data={formData} errors={errors} onChange={updateField} />
      <SportInfoSection data={formData} errors={errors} onChange={updateField} />
      <PriceSection data={formData} errors={errors} onChange={updateField} />
      <PedigreeSection data={formData} errors={errors} onChange={updateField} />
      <DescriptionSection data={formData} errors={errors} onChange={updateField} />
      <MediaSection
        data={formData}
        errors={errors}
        images={images}
        videoFile={videoFile}
        videoPreviewUrl={videoPreviewUrl}
        existingVideoUrl={
          existingVideo && !removeExistingVideo && !videoFile ? existingVideo.url : null
        }
        existingVideoFileName={existingVideo?.fileName ?? null}
        mediaError={mediaError}
        onChange={updateField}
        onImagesChange={setImages}
        onVideoFileChange={handleVideoFileChange}
        onRemoveExistingVideo={
          isEditMode && existingVideo && !removeExistingVideo
            ? handleRemoveExistingVideo
            : undefined
        }
        onMediaError={setMediaError}
      />
      <SellerInfoSection data={formData} errors={errors} onChange={updateField} />
      <VerificationSection data={formData} errors={errors} onChange={updateField} />

      {Object.keys(errors).length > 0 ? (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-6 py-4 text-red-300">
          Please review the highlighted fields before continuing.
        </div>
      ) : null}

      <div className="flex flex-col sm:flex-row gap-4 justify-end">
        {isEditMode && listingId ? (
          <Link
            href={`/horse/${listingId}`}
            className="px-8 py-4 rounded-xl border border-white/20 text-white hover:bg-white/10 font-semibold transition text-center"
          >
            Cancel
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleResetForm}
            className="px-8 py-4 rounded-xl border border-white/20 text-white hover:bg-white/10 font-semibold transition"
          >
            Clear Form
          </button>
        )}
        <button
          type="submit"
          className="px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition"
        >
          {isEditMode ? "Review Changes" : "Preview Listing"}
        </button>
      </div>
    </form>
  );
}
