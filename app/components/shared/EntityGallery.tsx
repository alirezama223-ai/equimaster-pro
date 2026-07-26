"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Image from "next/image";

type Props = {
  images: string[];
  altPrefix: string;
};

const SWIPE_THRESHOLD_PX = 48;

export default function EntityGallery({ images, altPrefix }: Props) {
  const galleryImages = useMemo(() => {
    const seen = new Set<string>();
    const normalized = images.filter((url) => {
      const trimmed = url?.trim();
      if (!trimmed || seen.has(trimmed)) return false;
      seen.add(trimmed);
      return true;
    });
    return normalized.length > 0 ? normalized : ["/emi.jpg"];
  }, [images]);

  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const hasMultipleImages = galleryImages.length > 1;
  const activeImage = galleryImages[activeIndex] ?? galleryImages[0];

  const goToIndex = useCallback(
    (index: number) => {
      if (galleryImages.length === 0) return;
      const wrapped = ((index % galleryImages.length) + galleryImages.length) % galleryImages.length;
      setActiveIndex(wrapped);
    },
    [galleryImages.length]
  );

  const goToPrevious = useCallback(() => {
    goToIndex(activeIndex - 1);
  }, [activeIndex, goToIndex]);

  const goToNext = useCallback(() => {
    goToIndex(activeIndex + 1);
  }, [activeIndex, goToIndex]);

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null || !hasMultipleImages) return;

    const touchEndX = event.changedTouches[0]?.clientX;
    if (touchEndX === undefined) return;

    const delta = touchEndX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(delta) < SWIPE_THRESHOLD_PX) return;

    if (delta > 0) {
      goToPrevious();
    } else {
      goToNext();
    }
  }

  return (
    <div className="space-y-4">
      <div
        className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border border-white/10 bg-[#111827]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={activeImage}
          alt={`${altPrefix} — photo ${activeIndex + 1}`}
          fill
          priority={activeIndex === 0}
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
        />

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

        {hasMultipleImages ? (
          <>
            <button
              type="button"
              onClick={goToPrevious}
              aria-label="Previous photo"
              className="absolute left-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur-md transition hover:bg-blue-600"
            >
              ←
            </button>

            <button
              type="button"
              onClick={goToNext}
              aria-label="Next photo"
              className="absolute right-4 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur-md transition hover:bg-blue-600"
            >
              →
            </button>

            <div className="absolute bottom-4 right-4 rounded-full border border-white/15 bg-black/60 px-3 py-1 text-sm font-semibold text-white backdrop-blur-md">
              {activeIndex + 1} / {galleryImages.length}
            </div>
          </>
        ) : null}
      </div>

      {hasMultipleImages ? (
        <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {galleryImages.map((image, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => goToIndex(index)}
                aria-label={`Show photo ${index + 1}`}
                aria-current={isActive}
                className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-xl border transition ${
                  isActive
                    ? "border-blue-500 ring-2 ring-blue-500/60"
                    : "border-white/10 hover:border-blue-400/60"
                }`}
              >
                <Image
                  src={image}
                  alt={`${altPrefix} thumbnail ${index + 1}`}
                  fill
                  sizes="112px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
