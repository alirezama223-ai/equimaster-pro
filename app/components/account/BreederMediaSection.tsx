"use client";

import Image from "next/image";
import { useEffect } from "react";
import FormField from "@/app/components/sell/FormField";
import FormSection from "@/app/components/sell/FormSection";
import { validateBreederImageFile } from "@/app/lib/breeder-image-storage";
import { BreederImageFieldState } from "@/app/types/breeder";

type ImageSlotProps = {
  label: string;
  kind: "logo" | "cover";
  state: BreederImageFieldState;
  error?: string;
  onSelect: (file: File, previewUrl: string) => void;
  onRemove: () => void;
};

function ImageSlot({ label, kind, state, error, onSelect, onRemove }: ImageSlotProps) {
  const displayUrl =
    state.previewUrl ??
    (!state.removed ? state.existingUrl : null);

  const isCover = kind === "cover";

  function handleSelection(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    onSelect(file, URL.createObjectURL(file));
    event.target.value = "";
  }

  return (
    <FormField label={label} error={error}>
      {displayUrl ? (
        <div className="space-y-4">
          <div
            className={`relative overflow-hidden rounded-2xl border border-white/10 bg-[#08111F] ${
              isCover ? "aspect-[21/9] w-full" : "mx-auto h-40 w-40"
            }`}
          >
            <Image
              src={displayUrl}
              alt={`${label} preview`}
              fill
              unoptimized={displayUrl.startsWith("blob:")}
              className={isCover ? "object-cover" : "object-cover p-2"}
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <label className="cursor-pointer rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 transition">
              Replace
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleSelection}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={onRemove}
              className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <label
          className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-blue-500/40 bg-[#08111F] px-6 py-8 text-center hover:border-blue-500 transition ${
            isCover ? "min-h-40" : "min-h-48"
          }`}
        >
          <span className="text-3xl">{isCover ? "🖼️" : "🏷️"}</span>
          <span className="text-white font-semibold">
            {isCover ? "Upload cover image" : "Upload logo"}
          </span>
          <span className="text-sm text-gray-400">
            JPG, PNG, WEBP, or GIF up to 10 MB.
          </span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleSelection}
            className="hidden"
          />
        </label>
      )}
    </FormField>
  );
}

type Props = {
  logo: BreederImageFieldState;
  cover: BreederImageFieldState;
  mediaError: string | null;
  onLogoChange: (state: BreederImageFieldState) => void;
  onCoverChange: (state: BreederImageFieldState) => void;
  onMediaError: (message: string | null) => void;
};

export default function BreederMediaSection({
  logo,
  cover,
  mediaError,
  onLogoChange,
  onCoverChange,
  onMediaError,
}: Props) {
  useEffect(() => {
    return () => {
      if (logo.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(logo.previewUrl);
      if (cover.previewUrl?.startsWith("blob:")) URL.revokeObjectURL(cover.previewUrl);
    };
  }, [logo.previewUrl, cover.previewUrl]);

  function handleSelect(
    kind: "logo" | "cover",
    current: BreederImageFieldState,
    onChange: (state: BreederImageFieldState) => void,
    file: File,
    previewUrl: string
  ) {
    const validationError = validateBreederImageFile(file);
    if (validationError) {
      onMediaError(validationError);
      URL.revokeObjectURL(previewUrl);
      return;
    }

    onMediaError(null);
    if (current.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(current.previewUrl);
    }

    onChange({
      ...current,
      file,
      previewUrl,
      removed: false,
    });
  }

  function handleRemove(
    current: BreederImageFieldState,
    onChange: (state: BreederImageFieldState) => void
  ) {
    if (current.previewUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(current.previewUrl);
    }

    onChange({
      file: null,
      previewUrl: null,
      existingUrl: current.existingUrl,
      existingStoragePath: current.existingStoragePath,
      removed: true,
    });
    onMediaError(null);
  }

  return (
    <FormSection
      title="Logo & Cover Images"
      subtitle="Upload a square logo and a wide cover image for your public stud farm profile."
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <ImageSlot
          label="Logo"
          kind="logo"
          state={logo}
          error={mediaError ?? undefined}
          onSelect={(file, previewUrl) => handleSelect("logo", logo, onLogoChange, file, previewUrl)}
          onRemove={() => handleRemove(logo, onLogoChange)}
        />

        <ImageSlot
          label="Cover Image"
          kind="cover"
          state={cover}
          onSelect={(file, previewUrl) => handleSelect("cover", cover, onCoverChange, file, previewUrl)}
          onRemove={() => handleRemove(cover, onCoverChange)}
        />
      </div>
    </FormSection>
  );
}
