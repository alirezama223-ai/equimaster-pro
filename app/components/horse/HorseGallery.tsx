"use client";

import { useTranslations } from "next-intl";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Horse } from "@/app/data/horses";
import { getHorseGalleryImages } from "@/app/lib/horse-listings";
import { useFocusTrap } from "@/app/hooks/useFocusTrap";

type Props = {
  horse: Horse;
};

const SWIPE_THRESHOLD_PX = 48;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.5;

export default memo(function HorseGallery({ horse }: Props) {
  const t = useTranslations("horse");
  const images = useMemo(() => getHorseGalleryImages(horse.images), [horse.images]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [imageVisible, setImageVisible] = useState(true);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const touchStartX = useRef<number | null>(null);
  const pinchStartDistance = useRef<number | null>(null);
  const pinchStartZoom = useRef(MIN_ZOOM);
  const liveRegionRef = useRef<HTMLDivElement>(null);
  const lightboxRef = useFocusTrap<HTMLDivElement>(isLightboxOpen);
  const openLightboxTriggerRef = useRef<HTMLButtonElement>(null);

  const hasMultipleImages = images.length > 1;
  const activeImage = images[activeIndex] ?? images[0];
  const totalImages = images.length;

  const photoAlt = useCallback(
    (index: number) =>
      t("gallery.photoAltDetailed", {
        name: horse.name,
        discipline: horse.discipline,
        index: index + 1,
        total: totalImages,
      }),
    [horse.discipline, horse.name, t, totalImages]
  );

  const thumbnailAlt = useCallback(
    (index: number) =>
      t("gallery.thumbnailAltDetailed", {
        name: horse.name,
        index: index + 1,
        total: totalImages,
      }),
    [horse.name, t, totalImages]
  );

  const announceSlide = useCallback(
    (index: number) => {
      if (!liveRegionRef.current) return;
      liveRegionRef.current.textContent = t("gallery.slideAnnouncement", {
        index: index + 1,
        total: totalImages,
      });
    },
    [t, totalImages]
  );

  const goToIndex = useCallback(
    (index: number) => {
      if (images.length === 0) return;
      const wrapped = ((index % images.length) + images.length) % images.length;
      if (wrapped === activeIndex) return;

      setImageVisible(false);
      window.setTimeout(() => {
        setActiveIndex(wrapped);
        setZoom(MIN_ZOOM);
        setImageVisible(true);
        announceSlide(wrapped);
      }, 180);
    },
    [activeIndex, announceSlide, images.length]
  );

  const goToPrevious = useCallback(() => {
    goToIndex(activeIndex - 1);
  }, [activeIndex, goToIndex]);

  const goToNext = useCallback(() => {
    goToIndex(activeIndex + 1);
  }, [activeIndex, goToIndex]);

  const openLightbox = useCallback(() => {
    setIsLightboxOpen(true);
    setZoom(MIN_ZOOM);
  }, []);

  const closeLightbox = useCallback(() => {
    setIsLightboxOpen(false);
    setZoom(MIN_ZOOM);
    openLightboxTriggerRef.current?.focus();
  }, []);

  const adjustZoom = useCallback((delta: number) => {
    setZoom((current) => {
      const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number((current + delta).toFixed(2))));
      return next;
    });
  }, []);

  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>) {
    if (event.touches.length === 2) {
      const [a, b] = [event.touches[0], event.touches[1]];
      pinchStartDistance.current = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      pinchStartZoom.current = zoom;
      touchStartX.current = null;
      return;
    }

    touchStartX.current = event.touches[0]?.clientX ?? null;
  }

  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    if (event.touches.length !== 2 || pinchStartDistance.current === null) {
      return;
    }

    const [a, b] = [event.touches[0], event.touches[1]];
    const distance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
    const scaleFactor = distance / pinchStartDistance.current;
    const nextZoom = Math.min(
      MAX_ZOOM,
      Math.max(MIN_ZOOM, Number((pinchStartZoom.current * scaleFactor).toFixed(2)))
    );
    setZoom(nextZoom);
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>) {
    if (event.touches.length < 2) {
      pinchStartDistance.current = null;
    }

    if (touchStartX.current === null || !hasMultipleImages || zoom > MIN_ZOOM) {
      touchStartX.current = null;
      return;
    }

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

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToPrevious();
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      goToNext();
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openLightbox();
      return;
    }

    if (isLightboxOpen && event.key === "Escape") {
      event.preventDefault();
      closeLightbox();
    }
  }

  useEffect(() => {
    if (!isLightboxOpen) return;

    function handleWindowKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeLightbox();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPrevious();
        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNext();
        return;
      }

      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        adjustZoom(ZOOM_STEP);
        return;
      }

      if (event.key === "-") {
        event.preventDefault();
        adjustZoom(-ZOOM_STEP);
      }
    }

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleWindowKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleWindowKeyDown);
    };
  }, [adjustZoom, closeLightbox, goToNext, goToPrevious, isLightboxOpen]);

  return (
    <div className="space-y-4">
      <div
        ref={liveRegionRef}
        className="sr-only"
        aria-live="polite"
        aria-atomic="true"
      />

      <div
        className="group relative aspect-[16/10] w-full overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0f1729] shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="region"
        aria-label={t("gallery.regionLabel", { name: horse.name })}
      >
        <button
          ref={openLightboxTriggerRef}
          type="button"
          onClick={openLightbox}
          className="absolute inset-0 z-10 cursor-zoom-in"
          aria-label={t("gallery.openLightbox")}
        >
          <Image
            src={activeImage}
            alt={photoAlt(activeIndex)}
            fill
            priority={activeIndex === 0}
            loading={activeIndex === 0 ? undefined : "lazy"}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 66vw, 900px"
            className={`object-contain object-center pointer-events-none transition-all duration-300 ease-out [@media(hover:hover)]:group-hover:scale-[1.02] ${
              imageVisible ? "opacity-100 scale-100" : "opacity-0 scale-[1.01]"
            }`}
          />
        </button>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />

        {totalImages > 0 ? (
          <>
            {hasMultipleImages ? (
              <>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    goToPrevious();
                  }}
                  aria-label={t("gallery.previousPhoto")}
                  className="absolute left-4 top-1/2 z-20 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur-md transition hover:bg-blue-600"
                >
                  ←
                </button>

                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    goToNext();
                  }}
                  aria-label={t("gallery.nextPhoto")}
                  className="absolute right-4 top-1/2 z-20 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/55 text-white backdrop-blur-md transition hover:bg-blue-600"
                >
                  →
                </button>
              </>
            ) : null}

            <div
              className="absolute bottom-4 right-4 z-20 rounded-full border border-white/15 bg-black/60 px-3 py-1 text-sm font-semibold text-white backdrop-blur-md"
              aria-hidden="true"
            >
              {t("gallery.photoCounter", { index: activeIndex + 1, total: totalImages })}
            </div>
          </>
        ) : null}

        <div className="pointer-events-none absolute bottom-4 left-4 z-20 rounded-full border border-white/15 bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white opacity-0 backdrop-blur-md transition group-hover:opacity-100 group-focus-within:opacity-100">
          {t("gallery.openLightboxHint")}
        </div>
      </div>

      {hasMultipleImages ? (
        <div className="scroll-touch flex gap-2.5 overflow-x-auto pb-1 snap-x snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-3 [&::-webkit-scrollbar]:hidden">
          {images.map((image, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => goToIndex(index)}
                aria-label={t("gallery.showPhoto", { index: index + 1 })}
                aria-current={isActive}
                className={`relative h-[72px] w-[96px] shrink-0 snap-start overflow-hidden rounded-xl border transition sm:h-20 sm:w-28 ${
                  isActive
                    ? "border-blue-500 ring-2 ring-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.25)]"
                    : "border-white/10 opacity-80 [@media(hover:hover)]:hover:border-blue-400/60 [@media(hover:hover)]:hover:opacity-100"
                }`}
              >
                <Image
                  src={image}
                  alt={thumbnailAlt(index)}
                  fill
                  loading="lazy"
                  sizes="112px"
                  className="object-cover"
                />
              </button>
            );
          })}
        </div>
      ) : null}

      {isLightboxOpen ? (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/95"
          role="dialog"
          aria-modal="true"
          aria-label={t("gallery.lightboxLabel", { name: horse.name })}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div
            ref={lightboxRef}
            className="flex h-full flex-col outline-none"
            tabIndex={-1}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
              <p className="text-sm font-semibold text-white">
                {t("gallery.photoCounter", { index: activeIndex + 1, total: totalImages })}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => adjustZoom(-ZOOM_STEP)}
                  aria-label={t("gallery.zoomOut")}
                  className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
                >
                  −
                </button>
                <span className="min-w-12 text-center text-sm text-gray-300" aria-hidden="true">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => adjustZoom(ZOOM_STEP)}
                  aria-label={t("gallery.zoomIn")}
                  className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={closeLightbox}
                  aria-label={t("gallery.closeLightbox")}
                  className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="relative flex-1 overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div
                  className="relative h-full w-full max-h-full max-w-full transition-transform duration-150 ease-out"
                  style={{ transform: `scale(${zoom})` }}
                >
                  <Image
                    src={activeImage}
                    alt={photoAlt(activeIndex)}
                    fill
                    sizes="100vw"
                    loading="lazy"
                    className="object-contain"
                  />
                </div>
              </div>

              {hasMultipleImages ? (
                <>
                  <button
                    type="button"
                    onClick={goToPrevious}
                    aria-label={t("gallery.previousPhoto")}
                    className="absolute left-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md transition hover:bg-blue-600"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={goToNext}
                    aria-label={t("gallery.nextPhoto")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white backdrop-blur-md transition hover:bg-blue-600"
                  >
                    →
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
});
