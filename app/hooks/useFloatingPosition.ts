"use client";

import {
  useCallback,
  useLayoutEffect,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import {
  computeFloatingPosition,
  FLOATING_Z_INDEX,
  getScrollParents,
  type FloatingPlacement,
} from "@/app/lib/floating-position";

type Options = {
  anchorRef: RefObject<HTMLElement | null>;
  floatingRef: RefObject<HTMLElement | null>;
  open: boolean;
  placement?: FloatingPlacement;
  matchWidth?: boolean;
  offset?: number;
  floatingWidth?: number;
};

export function useFloatingPosition({
  anchorRef,
  floatingRef,
  open,
  placement = "bottom-start",
  matchWidth = true,
  offset = 8,
  floatingWidth,
}: Options): CSSProperties | null {
  const [style, setStyle] = useState<CSSProperties | null>(null);

  const update = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) {
      setStyle(null);
      return;
    }

    const rect = anchor.getBoundingClientRect();
    const floatingHeight = floatingRef.current?.getBoundingClientRect().height;
    const position = computeFloatingPosition(rect, {
      placement,
      offset,
      matchWidth,
      floatingWidth,
      floatingHeight,
    });

    setStyle({
      position: "fixed",
      top: position.top,
      left: position.left,
      width: position.width,
      maxHeight: position.maxHeight,
      zIndex: FLOATING_Z_INDEX,
    });
  }, [anchorRef, floatingRef, floatingWidth, matchWidth, offset, placement]);

  useLayoutEffect(() => {
    if (!open) {
      setStyle(null);
      return;
    }

    update();

    const anchor = anchorRef.current;
    if (!anchor) return;

    const scrollParents = getScrollParents(anchor);
    for (const parent of scrollParents) {
      parent.addEventListener("scroll", update, { passive: true });
    }

    window.addEventListener("scroll", update, { passive: true, capture: true });
    window.addEventListener("resize", update, { passive: true });

    const visualViewport = window.visualViewport;
    visualViewport?.addEventListener("resize", update, { passive: true });
    visualViewport?.addEventListener("scroll", update, { passive: true });

    const resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(anchor);
    if (floatingRef.current) {
      resizeObserver.observe(floatingRef.current);
    }

    return () => {
      for (const parent of scrollParents) {
        parent.removeEventListener("scroll", update);
      }
      window.removeEventListener("scroll", update, { capture: true });
      window.removeEventListener("resize", update);
      visualViewport?.removeEventListener("resize", update);
      visualViewport?.removeEventListener("scroll", update);
      resizeObserver.disconnect();
    };
  }, [anchorRef, floatingRef, open, update]);

  return open ? style : null;
}
