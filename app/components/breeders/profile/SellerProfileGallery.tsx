"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useFocusTrap } from "@/app/hooks/useFocusTrap";

type Props = {
  images: string[];
  sellerName: string;
};

function SellerProfileGallery({ images, sellerName }: Props) {
  const uniqueImages = useMemo(
    () => [...new Set(images.filter((url) => url?.trim()))],
    [images]
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const lightboxRef = useFocusTrap<HTMLDivElement>(lightboxOpen);
  const touchStartX = useRef<number | null>(null);

  const activeImage = uniqueImages[activeIndex] ?? uniqueImages[0];

  const goTo = useCallback(
    (index: number) => {
      if (uniqueImages.length === 0) return;
      setActiveIndex(((index % uniqueImages.length) + uniqueImages.length) % uniqueImages.length);
    },
    [uniqueImages.length]
  );

  useEffect(() => {
    if (!lightboxOpen) return;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setLightboxOpen(false);
      if (event.key === "ArrowLeft") goTo(activeIndex - 1);
      if (event.key === "ArrowRight") goTo(activeIndex + 1);
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [activeIndex, goTo, lightboxOpen]);

  if (uniqueImages.length === 0) {
    return null;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
        {uniqueImages.slice(0, 6).map((image, index) => (
          <button
            key={`${image}-${index}`}
            type="button"
            onClick={() => {
              setActiveIndex(index);
              setLightboxOpen(true);
            }}
            className={`relative aspect-[4/3] overflow-hidden rounded-xl border transition duration-300 ${
              index === 0 ? "col-span-2 row-span-2 aspect-[16/10] sm:col-span-2" : "border-white/10"
            } [@media(hover:hover)]:hover:border-blue-500/40`}
          >
            <Image
              src={image}
              alt={`${sellerName} gallery ${index + 1}`}
              fill
              sizes="(max-width: 768px) 50vw, 300px"
              loading="lazy"
              className="object-cover transition duration-500 [@media(hover:hover)]:hover:scale-[1.03]"
            />
          </button>
        ))}
      </div>

      {lightboxOpen && activeImage ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/95" role="dialog" aria-modal="true">
          <div ref={lightboxRef} className="flex h-full flex-col outline-none" tabIndex={-1}>
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <p className="text-sm font-semibold text-white">
                {activeIndex + 1} / {uniqueImages.length}
              </p>
              <button
                type="button"
                onClick={() => setLightboxOpen(false)}
                className="rounded-lg border border-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/10"
              >
                ×
              </button>
            </div>
            <div
              className="relative flex-1"
              onTouchStart={(event) => {
                touchStartX.current = event.touches[0]?.clientX ?? null;
              }}
              onTouchEnd={(event) => {
                if (touchStartX.current === null || uniqueImages.length < 2) return;
                const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStartX.current;
                touchStartX.current = null;
                if (Math.abs(delta) < 48) return;
                goTo(delta > 0 ? activeIndex - 1 : activeIndex + 1);
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="relative h-full w-full max-w-5xl">
                  <Image src={activeImage} alt="" fill sizes="100vw" className="object-contain" />
                </div>
              </div>
              {uniqueImages.length > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() => goTo(activeIndex - 1)}
                    className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={() => goTo(activeIndex + 1)}
                    className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/60 text-white"
                  >
                    →
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export default memo(SellerProfileGallery);
