"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useFloatingPosition } from "@/app/hooks/useFloatingPosition";
import type { FloatingPlacement } from "@/app/lib/floating-position";

type Props = {
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  children: ReactNode;
  className?: string;
  placement?: FloatingPlacement;
  matchWidth?: boolean;
  offset?: number;
  floatingWidth?: number;
};

export default function FloatingPortal({
  anchorRef,
  open,
  children,
  className,
  placement = "bottom-start",
  matchWidth = true,
  offset = 8,
  floatingWidth,
}: Props) {
  const floatingRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const style = useFloatingPosition({
    anchorRef,
    floatingRef,
    open,
    placement,
    matchWidth,
    offset,
    floatingWidth,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !open || !style) {
    return null;
  }

  return createPortal(
    <div
      ref={floatingRef}
      data-floating-overlay
      style={style}
      className={className}
    >
      {children}
    </div>,
    document.body
  );
}
