"use client";

import { useEffect, useRef, useState } from "react";
import {
  isMobileNavDiagEnabled,
  subscribeMobileNavDebugLines,
} from "@/app/lib/debug/mobile-nav-diagnostics";

const MAX_LINES = 200;

/** Temporary on-screen nav trace for Mobile Safari debugging. */
export default function MobileNavDebugBox() {
  const [lines, setLines] = useState<string[]>([]);
  const containerRef = useRef<HTMLPreElement>(null);

  useEffect(() => {
    if (!isMobileNavDiagEnabled()) {
      return;
    }

    return subscribeMobileNavDebugLines((line) => {
      setLines((current) => [...current.slice(-(MAX_LINES - 1)), line]);
    });
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [lines]);

  if (!isMobileNavDiagEnabled()) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      aria-label="Mobile navigation debug log"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[500] border-t border-amber-400/40 bg-black/90 p-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] font-mono text-[10px] leading-4 text-amber-100 shadow-[0_-8px_24px_rgba(0,0,0,0.45)] md:max-w-md md:left-auto md:right-2 md:bottom-2 md:rounded-lg md:border"
    >
      <div className="mb-1 text-[9px] uppercase tracking-wide text-amber-300/80">
        Mobile Nav Debug
      </div>
      <pre
        ref={containerRef}
        className="max-h-40 overflow-y-auto whitespace-pre-wrap break-all"
      >
        {lines.length > 0 ? lines.join("\n") : "waiting for navigation…"}
      </pre>
    </div>
  );
}
